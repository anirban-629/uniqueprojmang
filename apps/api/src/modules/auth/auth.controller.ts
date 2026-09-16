import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import {
  RegisterRoute,
  LoginRoute,
  RefreshTokenRoute,
  SwitchTenantRoute,
  InviteUserRoute,
  AcceptInviteRoute,
  LogoutRoute,
  ListUsersRoute,
  GetCurrentUserRoute,
  ListCompaniesRoute,
  ListSessionsRoute
} from './auth.types.js';

export async function register(
  request: FastifyRequest<RegisterRoute>,
  reply: FastifyReply
) {
  const result = await authService.register(request.body, {
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
  return reply.status(201).send(result);
}

export async function login(
  request: FastifyRequest<LoginRoute>,
  reply: FastifyReply
) {
  const result = await authService.login(request.body, {
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
  return reply.status(200).send(result);
}

export async function refresh(
  request: FastifyRequest<RefreshTokenRoute>,
  reply: FastifyReply
) {
  const result = await authService.refresh(request.body.refreshToken, {
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
  return reply.status(200).send(result);
}

export async function switchTenant(
  request: FastifyRequest<SwitchTenantRoute>,
  reply: FastifyReply
) {
  const result = await authService.switchTenant(
    request.companyTenant.userId,
    request.body.targetTenantId
  );
  return reply.status(200).send(result);
}

export async function inviteUser(
  request: FastifyRequest<InviteUserRoute>,
  reply: FastifyReply
) {
  const result = await authService.inviteUser(request.companyTenant, request.body);
  return reply.status(201).send(result);
}

export async function acceptInvite(
  request: FastifyRequest<AcceptInviteRoute>,
  reply: FastifyReply
) {
  const result = await authService.acceptInvite(request.body);
  return reply.status(200).send(result);
}

export async function logout(
  request: FastifyRequest<LogoutRoute>,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  const refreshToken = request.body?.refreshToken;
  await authService.logout(authHeader, refreshToken);
  return reply.status(200).send({ message: 'Logged out successfully' });
}

export async function logoutAll(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authService.logoutAll(request.companyTenant.userId);
  return reply.status(200).send({ message: 'All active sessions revoked' });
}

export async function listSessions(
  request: FastifyRequest<ListSessionsRoute>,
  reply: FastifyReply
) {
  const sessions = authService.listSessions(request.companyTenant.userId);
  return reply.status(200).send(sessions);
}

export async function getCurrentUser(
  request: FastifyRequest<GetCurrentUserRoute>,
  reply: FastifyReply
) {
  const result = await authService.getCurrentUserContext(request.companyTenant);
  return reply.send(result);
}

export async function listUsers(
  _request: FastifyRequest<ListUsersRoute>,
  reply: FastifyReply
) {
  const users = await authService.getUsers();
  return reply.send(users);
}

export async function listCompanies(
  _request: FastifyRequest<ListCompaniesRoute>,
  reply: FastifyReply
) {
  const companies = await authService.getCompanies();
  return reply.send(companies);
}

export async function listTenantMembers(
  request: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply
) {
  const members = await authService.listTenantMembers(request.params.tenantId);
  return reply.status(200).send(members);
}

export async function updateMemberRole(
  request: FastifyRequest<{ Params: { tenantId: string; userId: string }; Body: { role: any } }>,
  reply: FastifyReply
) {
  const result = await authService.updateMemberRole(
    request.companyTenant.userId,
    request.params.tenantId,
    request.params.userId,
    request.body.role
  );
  return reply.status(200).send(result);
}

export async function removeMember(
  request: FastifyRequest<{ Params: { tenantId: string; userId: string } }>,
  reply: FastifyReply
) {
  const result = await authService.removeTenantMember(
    request.companyTenant.userId,
    request.params.tenantId,
    request.params.userId
  );
  return reply.status(200).send(result);
}

export async function listPermissions(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const permissions = await authService.getAllPermissions();
  return reply.status(200).send(permissions);
}

