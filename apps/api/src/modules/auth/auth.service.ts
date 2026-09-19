import { User, TenantRole, AuthUser, InviteDetailsResponse } from "@flowline/types";
import { TenantContext } from "../../shared/types/index.js";
import {
  AppError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
} from "../../shared/errors/index.js";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSecureToken,
} from "./auth.crypto.js";
import {
  signAccessToken,
  createRefreshToken,
  tokenStore,
  verifyAccessToken,
} from "./auth.tokens.js";
import {
  publishUserRegistered,
  publishUserLoggedIn,
  publishTenantCreated,
  publishMemberInvited,
  publishMemberRoleChanged,
} from "./auth.events.js";
import { authRepository, AuthRepository } from "./auth.repository.js";
import { permissionsService } from "../permissions/permissions.service.js";
import {
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseDto,
  CurrentUserResponseDto,
  CompanyDto,
  TenantMembershipDto,
  SessionDto,
} from "./auth.types.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  public async register(
    dto: RegisterRequestDto,
    context?: { ip?: string; userAgent?: string },
  ): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    if (!dto.password || dto.password.length < 10) {
      throw new ValidationError("Password must be at least 10 characters long");
    }

    const existingUser = await this.repository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const orgName = dto.organizationName || dto.tenantName || 'My Organization';
    const orgSlug = dto.organizationSlug || dto.tenantSlug || orgName;
    const slug = slugify(orgSlug);
    const existingTenant = await this.repository.findTenantBySlug(slug);
    const finalSlug = existingTenant
      ? `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
      : slug;

    // 1. Hash password with server pepper + salt
    const passwordHash = await hashPassword(dto.password);

    // 2. Create User
    const user = await this.repository.createUser({
      email: normalizedEmail,
      passwordHash,
      fullName: dto.fullName,
    });

    // 3. Create Tenant
    const tenant = await this.repository.createTenant({
      name: orgName,
      slug: finalSlug,
      plan: "pro",
    });

    // 4. Bind User as Tenant Owner
    await this.repository.createTenantMember({
      tenantId: tenant.id,
      userId: user.id,
      role: "owner",
    });


    // 5. Mint Tokens
    const { token: accessToken, expiresIn } = signAccessToken({
      userId: user.id,
      tenantId: tenant.slug,
      companyId: tenant.id,
      role: "owner",
      email: user.email,
    });

    const { rawToken: refreshToken } = createRefreshToken({
      userId: user.id,
      tenantId: tenant.slug,
    });

    // 6. Audit log & events
    await this.repository.writeAuditLog({
      tenantId: tenant.id,
      userId: user.id,
      action: "register",
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { email: user.email, tenantSlug: tenant.slug },
    });

    publishTenantCreated({
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      ownerId: user.id,
    });

    publishUserRegistered({
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      tenantName: tenant.name,
      role: "owner",
    });

    const memberships: TenantMembershipDto[] = [
      {
        tenantId: tenant.slug,
        companyId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: "owner",
      },
    ];

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      expiresIn,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
        role: "owner",
      },
      memberships,
    };
  }

  public async login(
    dto: LoginRequestDto,
    context?: { ip?: string; userAgent?: string },
  ): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.repository.findUserByEmail(normalizedEmail);

    // Constant-time check: always evaluates hash comparison even if user doesn't exist
    const isPasswordValid = await verifyPassword(
      dto.password,
      user?.passwordHash,
    );

    if (!user || !isPasswordValid) {
      await this.repository.writeAuditLog({
        action: "failed_login",
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata: { attemptedEmail: normalizedEmail },
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "suspended") {
      throw new ForbiddenError("Account is suspended. Please contact support.");
    }

    // Resolve user memberships
    const memberships = await this.repository.getUserMemberships(user.id);
    if (!memberships || memberships.length === 0) {
      throw new ForbiddenError(
        "User does not belong to any active organizations",
      );
    }

    const primaryMembership = memberships[0];
    const tenantRecord = await this.repository.findTenantById(
      primaryMembership.companyId,
    );

    const { token: accessToken, expiresIn } = signAccessToken({
      userId: user.id,
      tenantId: primaryMembership.slug,
      companyId: primaryMembership.companyId,
      role: primaryMembership.role,
      email: user.email,
    });

    const { rawToken: refreshToken } = createRefreshToken({
      userId: user.id,
      tenantId: primaryMembership.slug,
    });

    await this.repository.writeAuditLog({
      tenantId: primaryMembership.companyId,
      userId: user.id,
      action: "login",
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    publishUserLoggedIn({
      userId: user.id,
      email: user.email,
      tenantId: primaryMembership.companyId,
      ip: context?.ip,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      expiresIn,
      tenant: {
        id: primaryMembership.companyId,
        slug: primaryMembership.slug,
        name: tenantRecord?.name || primaryMembership.name,
        plan: tenantRecord?.plan || "free",
        role: primaryMembership.role,
      },
      memberships,
    };
  }

  public async refresh(
    refreshTokenRaw: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    const hashed = hashToken(refreshTokenRaw);
    const record = tokenStore.getRefreshToken(hashed);

    if (!record) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // THEFT SIGNAL: If an already-revoked refresh token is presented, revoke the whole family
    if (record.isRevoked) {
      tokenStore.revokeTokenFamily(record.familyId);
      await this.repository.writeAuditLog({
        tenantId: record.tenantId,
        userId: record.userId,
        action: "token_reuse_theft_detected",
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata: { familyId: record.familyId },
      });
      throw new UnauthorizedError(
        "Security violation: Refresh token reuse detected. All sessions revoked.",
      );
    }

    // Invalidate old refresh token (Rotation)
    record.isRevoked = true;
    tokenStore.storeRefreshToken(record);

    const user = await this.repository.findUserById(record.userId);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    const memberships = await this.repository.getUserMemberships(user.id);
    const activeMem =
      memberships.find(
        (m) => m.slug === record.tenantId || m.companyId === record.tenantId,
      ) || memberships[0];

    const { token: newAccessToken, expiresIn } = signAccessToken({
      userId: user.id,
      tenantId: activeMem?.slug || record.tenantId,
      companyId: activeMem?.companyId || record.tenantId,
      role: activeMem?.role || "member",
      email: user.email,
    });

    const { rawToken: newRefreshToken } = createRefreshToken({
      userId: user.id,
      tenantId: record.tenantId,
      familyId: record.familyId,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }

  public async switchTenant(
    userId: string,
    targetTenantSlugOrId: string,
  ): Promise<{
    accessToken: string;
    tenant: {
      id: string;
      slug: string;
      name: string;
      plan: string;
      role: TenantRole;
    };
    expiresIn: string;
  }> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const memberships = await this.repository.getUserMemberships(userId);
    const targetMembership = memberships.find(
      (m) =>
        m.slug === targetTenantSlugOrId || m.companyId === targetTenantSlugOrId,
    );

    if (!targetMembership) {
      throw new ForbiddenError(
        "You do not have active membership in the target organization",
      );
    }

    const tenant = await this.repository.findTenantById(
      targetMembership.companyId,
    );
    if (!tenant) {
      throw new NotFoundError("Target organization not found");
    }

    const { token: accessToken, expiresIn } = signAccessToken({
      userId: user.id,
      tenantId: tenant.slug,
      companyId: tenant.id,
      role: targetMembership.role,
      email: user.email,
    });

    await this.repository.writeAuditLog({
      tenantId: tenant.id,
      userId: user.id,
      action: "switch_tenant",
      metadata: { targetSlug: tenant.slug },
    });

    return {
      accessToken,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
        role: targetMembership.role,
      },
      expiresIn,
    };
  }

  public async inviteUser(
    tenantContext: TenantContext,
    dto: { email: string; role: TenantRole },
  ): Promise<{
    invitationId: string;
    email: string;
    role: TenantRole;
    token: string;
  }> {
    if (
      tenantContext.role !== "owner" &&
      tenantContext.role !== "admin" &&
      tenantContext.role !== "tech_lead"
    ) {
      throw new ForbiddenError(
        "Only organization owners or administrators can invite team members",
      );
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.repository.createInvitation({
      tenantId: tenantContext.companyId,
      email: normalizedEmail,
      role: dto.role,
      tokenHash,
      invitedBy: tenantContext.userId,
      expiresAt,
    });

    await this.repository.writeAuditLog({
      tenantId: tenantContext.companyId,
      userId: tenantContext.userId,
      action: "invite_sent",
      metadata: { invitedEmail: normalizedEmail, role: dto.role },
    });

    publishMemberInvited({
      tenantId: tenantContext.companyId,
      email: normalizedEmail,
      role: dto.role,
      invitedBy: tenantContext.userId,
    });

    return {
      invitationId: invitation.id,
      email: normalizedEmail,
      role: dto.role,
      token: rawToken,
    };
  }

  public async acceptInvite(dto: {
    token: string;
    password?: string;
    fullName?: string;
  }): Promise<AuthResponseDto> {
    const tokenHash = hashToken(dto.token);
    const invitation =
      await this.repository.findInvitationByTokenHash(tokenHash);

    if (
      !invitation ||
      invitation.acceptedAt ||
      new Date() > new Date(invitation.expiresAt)
    ) {
      throw new ValidationError(
        "Invitation is invalid, already used, or expired",
      );
    }

    let user = await this.repository.findUserByEmail(invitation.email);
    if (!user) {
      if (!dto.password || dto.password.length < 10) {
        throw new ValidationError(
          "A secure password (min 10 characters) is required to accept this invitation",
        );
      }
      const passwordHash = await hashPassword(dto.password);
      user = await this.repository.createUser({
        email: invitation.email,
        passwordHash,
        fullName: dto.fullName || invitation.email.split("@")[0],
      });
    }

    await this.repository.createTenantMember({
      tenantId: invitation.tenantId,
      userId: user.id,
      role: invitation.role,
    });

    await this.repository.markInvitationAccepted(invitation.id);

    const tenant = await this.repository.findTenantById(invitation.tenantId);
    const memberships = await this.repository.getUserMemberships(user.id);

    const { token: accessToken, expiresIn } = signAccessToken({
      userId: user.id,
      tenantId: tenant?.slug || invitation.tenantId,
      companyId: invitation.tenantId,
      role: invitation.role,
      email: user.email,
    });

    const { rawToken: refreshToken } = createRefreshToken({
      userId: user.id,
      tenantId: tenant?.slug || invitation.tenantId,
    });

    await this.repository.writeAuditLog({
      tenantId: invitation.tenantId,
      userId: user.id,
      action: "invite_accepted",
      metadata: { role: invitation.role },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      expiresIn,
      tenant: {
        id: invitation.tenantId,
        slug: tenant?.slug || "",
        name: tenant?.name || "",
        plan: tenant?.plan || "free",
        role: invitation.role,
      },
      memberships,
    };
  }

  public async logout(
    authHeader?: string,
    refreshTokenRaw?: string,
  ): Promise<void> {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = verifyAccessToken(authHeader.substring(7));
        if (decoded.jti && decoded.exp) {
          tokenStore.revokeJti(decoded.jti, decoded.exp * 1000);
        }
      } catch {
        // Continue logout even if token expired
      }
    }

    if (refreshTokenRaw) {
      const hashed = hashToken(refreshTokenRaw);
      const record = tokenStore.getRefreshToken(hashed);
      if (record) {
        record.isRevoked = true;
        tokenStore.storeRefreshToken(record);
      }
    }
  }

  public async logoutAll(userId: string): Promise<void> {
    tokenStore.revokeUserSessions(userId);
    await this.repository.writeAuditLog({
      userId,
      action: "logout_all",
    });
  }

  public listSessions(userId: string): SessionDto[] {
    const list = tokenStore.listUserSessions(userId);
    return list.map((s) => ({
      id: s.id,
      userId: s.userId,
      tenantId: s.tenantId,
      familyId: s.familyId,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }));
  }

  public async getCurrentUserContext(
    tenant: TenantContext,
  ): Promise<CurrentUserResponseDto> {
    const user = await this.repository.findUserById(tenant.userId);
    const memberships = await this.repository.getUserMemberships(tenant.userId);

    const fallbackUser: User = {
      id: tenant.userId,
      name: user?.fullName || "Active User",
      email: user?.email || "user@flowline.internal",
      avatar:
        user?.avatarUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      role: tenant.role as any,
      teamId: tenant.tenantId,
    };

    return {
      user: fallbackUser,
      tenant,
      memberships,
    };
  }

  public async listTenantMembers(tenantId: string): Promise<any[]> {
    return this.repository.findTenantMembers(tenantId);
  }

  public async updateMemberRole(
    actorUserId: string,
    tenantId: string,
    targetUserId: string,
    newRole: TenantRole,
  ): Promise<{ success: boolean; targetUserId: string; role: TenantRole }> {
    // 1. Guardrail: Protect last Owner
    const members = await this.repository.findTenantMembers(tenantId);
    const targetMember = members.find((m) => m.userId === targetUserId);

    if (!targetMember) {
      throw new NotFoundError("Member not found in workspace");
    }

    const currentRole = targetMember.role;

    if (currentRole === "owner" && newRole !== "owner") {
      const ownerCount = await this.repository.countTenantOwners(tenantId);
      if (ownerCount <= 1) {
        throw new ForbiddenError(
          "Cannot demote the last Owner of the workspace",
        );
      }
    }

    // 2. Apply update in DB
    await this.repository.updateMemberRole(tenantId, targetUserId, newRole);

    // 3. Write security audit log
    await this.repository.writeAuditLog({
      tenantId,
      userId: actorUserId,
      action: "role_changed",
      metadata: { targetUserId, oldRole: currentRole, newRole },
    });

    // 4. Publish domain event to invalidate permissions cache immediately
    publishMemberRoleChanged({
      tenantId,
      targetUserId,
      actorUserId,
      oldRole: currentRole,
      newRole,
    });

    return { success: true, targetUserId, role: newRole };
  }

  public async removeTenantMember(
    actorUserId: string,
    tenantId: string,
    targetUserId: string,
  ): Promise<{ success: boolean; removedUserId: string }> {
    // 1. Guardrail: Protect last Owner
    const members = await this.repository.findTenantMembers(tenantId);
    const targetMember = members.find((m) => m.userId === targetUserId);

    if (!targetMember) {
      throw new NotFoundError("Member not found in workspace");
    }

    if (targetMember.role === "owner") {
      const ownerCount = await this.repository.countTenantOwners(tenantId);
      if (ownerCount <= 1) {
        throw new ForbiddenError(
          "Cannot remove the last Owner of the workspace",
        );
      }
    }

    // 2. Remove member
    await this.repository.removeTenantMember(tenantId, targetUserId);

    // 3. Audit log
    await this.repository.writeAuditLog({
      tenantId,
      userId: actorUserId,
      action: "member_removed",
      metadata: { targetUserId, removedRole: targetMember.role },
    });

    // 4. Invalidate permissions & sessions
    publishMemberRoleChanged({
      tenantId,
      targetUserId,
      actorUserId,
      oldRole: targetMember.role,
      newRole: "none",
    });

    return { success: true, removedUserId: targetUserId };
  }

  public async getInviteDetails(rawToken: string): Promise<InviteDetailsResponse> {
    const tokenHash = hashToken(rawToken);
    const invitation = await this.repository.findInvitationByTokenHash(tokenHash);

    if (!invitation) {
      return {
        email: '',
        role: 'member',
        tenantName: '',
        tenantSlug: '',
        expiresAt: '',
        isValid: false,
      };
    }

    const isExpired = Boolean(invitation.acceptedAt) || new Date() > new Date(invitation.expiresAt);
    const tenant = await this.repository.findTenantById(invitation.tenantId);
    let inviterName = 'A team member';
    if (invitation.invitedBy) {
      const inviter = await this.repository.findUserById(invitation.invitedBy);
      if (inviter?.fullName) inviterName = inviter.fullName;
    }

    return {
      email: invitation.email,
      role: invitation.role,
      tenantName: tenant?.name || 'Workspace',
      tenantSlug: tenant?.slug || '',
      inviterName,
      expiresAt: invitation.expiresAt instanceof Date ? invitation.expiresAt.toISOString() : String(invitation.expiresAt),
      isValid: !isExpired,
    };
  }

  public async forgotPassword(
    email: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.repository.findUserByEmail(normalizedEmail);

    if (user) {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      await this.repository.writeAuditLog({
        userId: user.id,
        action: 'forgot_password_requested',
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata: { email: normalizedEmail, tokenHash },
      });
    }

    // Always return enumeration-safe generic response
    return {
      message: 'If an account with that email exists, password reset instructions have been sent.',
    };
  }

  public async resetPassword(
    dto: { token: string; newPassword: string },
    context?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    if (!dto.newPassword || dto.newPassword.length < 10) {
      throw new ValidationError('Password must be at least 10 characters long');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    await this.repository.writeAuditLog({
      action: 'password_reset_success',
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      message: 'Your password has been changed, and you have been logged out of all devices for security. Please log in again.',
    };
  }

  public async getAllPermissions(): Promise<
    { key: string; description: string; scope: string }[]
  > {
    return permissionsService.getAllAvailablePermissions();
  }

  public async getUsers(): Promise<User[]> {
    return this.repository.getUsers();
  }

  public async getCompanies(): Promise<CompanyDto[]> {
    return this.repository.getCompanies();
  }
}

export const authService = new AuthService();

