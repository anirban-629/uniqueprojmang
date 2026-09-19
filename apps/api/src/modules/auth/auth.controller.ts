import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service.js";
import {
  RegisterRoute,
  LoginRoute,
  RefreshTokenRoute,
  SwitchTenantRoute,
  InviteUserRoute,
  AcceptInviteRoute,
  GetInviteDetailsRoute,
  ForgotPasswordRoute,
  ResetPasswordRoute,
  LogoutRoute,
  ListUsersRoute,
  GetCurrentUserRoute,
  ListCompaniesRoute,
  ListSessionsRoute,
} from "./auth.types.js";

function setAuthCookies(
  reply: FastifyReply,
  result: {
    accessToken?: string;
    refreshToken?: string;
    user?: any;
    tenant?: any;
  },
) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = isProd ? "None" : "Lax";
  const secure = isProd;

  if (result.accessToken) {
    const cookies = [
      `flowline_session=${result.accessToken}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
      `access_token=${result.accessToken}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
      ...(result.refreshToken
        ? [
            `flowline_refresh=${result.refreshToken}; Path=/; Max-Age=${maxAge * 4}; HttpOnly; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
          ]
        : []),
      ...(result.user?.id
        ? [
            `flowline_user_id=${result.user.id}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
          ]
        : []),
      ...(result.tenant?.slug || result.tenant?.id
        ? [
            `flowline_tenant_id=${result.tenant.slug || result.tenant.id}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
          ]
        : []),
      ...(result.tenant?.role
        ? [
            `flowline_role=${result.tenant.role}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
          ]
        : []),
    ];
    reply.header("Set-Cookie", cookies);
  }
}

function clearAuthCookies(reply: FastifyReply) {
  reply.header("Set-Cookie", [
    `flowline_session=; Path=/; Max-Age=0; HttpOnly`,
    `access_token=; Path=/; Max-Age=0`,
    `flowline_refresh=; Path=/; Max-Age=0; HttpOnly`,
    `flowline_user_id=; Path=/; Max-Age=0`,
    `flowline_tenant_id=; Path=/; Max-Age=0`,
    `flowline_role=; Path=/; Max-Age=0`,
  ]);
}

export async function register(
  request: FastifyRequest<RegisterRoute>,
  reply: FastifyReply,
) {
  const result = await authService.register(request.body, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });
  setAuthCookies(reply, result);
  return reply.status(201).send(result);
}

export async function login(
  request: FastifyRequest<LoginRoute>,
  reply: FastifyReply,
) {
  const result = await authService.login(request.body, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });
  setAuthCookies(reply, result);
  return reply.status(200).send(result);
}

export async function refresh(
  request: FastifyRequest<RefreshTokenRoute>,
  reply: FastifyReply,
) {
  const result = await authService.refresh(request.body.refreshToken, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });
  setAuthCookies(reply, result);
  return reply.status(200).send(result);
}

export async function switchTenant(
  request: FastifyRequest<SwitchTenantRoute>,
  reply: FastifyReply,
) {
  const result = await authService.switchTenant(
    request.companyTenant.userId,
    request.body.targetTenantId,
  );
  setAuthCookies(reply, result);
  return reply.status(200).send(result);
}

export async function inviteUser(
  request: FastifyRequest<InviteUserRoute>,
  reply: FastifyReply,
) {
  const result = await authService.inviteUser(
    request.companyTenant,
    request.body,
  );
  return reply.status(201).send(result);
}

export async function acceptInvite(
  request: FastifyRequest<AcceptInviteRoute>,
  reply: FastifyReply,
) {
  const result = await authService.acceptInvite(request.body);
  setAuthCookies(reply, result);
  return reply.status(200).send(result);
}

export async function getInviteDetails(
  request: FastifyRequest<GetInviteDetailsRoute>,
  reply: FastifyReply,
) {
  const result = await authService.getInviteDetails(request.params.token);
  return reply.status(200).send(result);
}

export async function forgotPassword(
  request: FastifyRequest<ForgotPasswordRoute>,
  reply: FastifyReply,
) {
  const result = await authService.forgotPassword(request.body.email, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });
  return reply.status(200).send(result);
}

export async function resetPassword(
  request: FastifyRequest<ResetPasswordRoute>,
  reply: FastifyReply,
) {
  const result = await authService.resetPassword(request.body, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });
  return reply.status(200).send(result);
}

export async function logout(
  request: FastifyRequest<LogoutRoute>,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;
  const refreshToken = request.body?.refreshToken;
  await authService.logout(authHeader, refreshToken);
  clearAuthCookies(reply);
  return reply.status(200).send({ message: "Logged out successfully" });
}

export async function logoutAll(request: FastifyRequest, reply: FastifyReply) {
  await authService.logoutAll(request.companyTenant.userId);
  clearAuthCookies(reply);
  return reply.status(200).send({ message: "All active sessions revoked" });
}

export async function listSessions(
  request: FastifyRequest<ListSessionsRoute>,
  reply: FastifyReply,
) {
  const sessions = authService.listSessions(request.companyTenant.userId);
  return reply.status(200).send(sessions);
}

export async function getCurrentUser(
  request: FastifyRequest<GetCurrentUserRoute>,
  reply: FastifyReply,
) {
  const result = await authService.getCurrentUserContext(request.companyTenant);
  return reply.send(result);
}

export async function listUsers(
  _request: FastifyRequest<ListUsersRoute>,
  reply: FastifyReply,
) {
  const users = await authService.getUsers();
  return reply.send(users);
}

export async function listCompanies(
  _request: FastifyRequest<ListCompaniesRoute>,
  reply: FastifyReply,
) {
  const companies = await authService.getCompanies();
  return reply.send(companies);
}

export async function listTenantMembers(
  request: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply,
) {
  const members = await authService.listTenantMembers(request.params.tenantId);
  return reply.status(200).send(members);
}

export async function updateMemberRole(
  request: FastifyRequest<{
    Params: { tenantId: string; userId: string };
    Body: { role: any };
  }>,
  reply: FastifyReply,
) {
  const result = await authService.updateMemberRole(
    request.companyTenant.userId,
    request.params.tenantId,
    request.params.userId,
    request.body.role,
  );
  return reply.status(200).send(result);
}

export async function removeMember(
  request: FastifyRequest<{ Params: { tenantId: string; userId: string } }>,
  reply: FastifyReply,
) {
  const result = await authService.removeTenantMember(
    request.companyTenant.userId,
    request.params.tenantId,
    request.params.userId,
  );
  return reply.status(200).send(result);
}

export async function listPermissions(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const permissions = await authService.getAllPermissions();
  return reply.status(200).send(permissions);
}
