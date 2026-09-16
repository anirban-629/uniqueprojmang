import { FastifyPluginAsync } from 'fastify';
import * as controller from './auth.controller.js';
import * as schemas from './auth.schema.js';
import { requirePermission } from '../../plugins/index.js';
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
  ListSessionsRoute,
  ListTenantMembersRoute,
  UpdateMemberRoleRoute,
  RemoveMemberRoute,
  ListPermissionsRoute
} from './auth.types.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Authentication & Registration Endpoints
  fastify.post<RegisterRoute>('/api/auth/register', { schema: schemas.registerSchema }, controller.register);
  fastify.post<LoginRoute>('/api/auth/login', { schema: schemas.loginSchema }, controller.login);
  fastify.post<RefreshTokenRoute>('/api/auth/refresh', { schema: schemas.refreshSchema }, controller.refresh);
  fastify.post<LogoutRoute>('/api/auth/logout', { schema: schemas.logoutSchema }, controller.logout);
  fastify.post('/api/auth/logout-all', { schema: schemas.logoutAllSchema }, controller.logoutAll);

  // Multi-Tenancy & Workspace Operations
  fastify.post<SwitchTenantRoute>('/api/auth/switch-tenant', { schema: schemas.switchTenantSchema }, controller.switchTenant);
  fastify.post<InviteUserRoute>('/api/auth/invite', { schema: schemas.inviteUserSchema, preHandler: [requirePermission('invitations.create')] }, controller.inviteUser);
  fastify.post<AcceptInviteRoute>('/api/auth/accept-invite', { schema: schemas.acceptInviteSchema }, controller.acceptInvite);
  fastify.get<ListSessionsRoute>('/api/auth/sessions', { schema: schemas.listSessionsSchema }, controller.listSessions);

  // RBAC Member & Role Management
  fastify.get<ListTenantMembersRoute>('/api/tenants/:tenantId/members', { schema: schemas.listTenantMembersSchema, preHandler: [requirePermission('members.view')] }, controller.listTenantMembers);
  fastify.patch<UpdateMemberRoleRoute>('/api/tenants/:tenantId/members/:userId/role', { schema: schemas.updateMemberRoleSchema, preHandler: [requirePermission('members.manage')] }, controller.updateMemberRole);
  fastify.delete<RemoveMemberRoute>('/api/tenants/:tenantId/members/:userId', { schema: schemas.removeMemberSchema, preHandler: [requirePermission('members.remove')] }, controller.removeMember);
  fastify.get<ListPermissionsRoute>('/api/permissions', { schema: schemas.listPermissionsSchema }, controller.listPermissions);

  // User Profile & Tenant Context
  fastify.get<GetCurrentUserRoute>('/api/auth/me', { schema: schemas.getCurrentUserSchema }, controller.getCurrentUser);
  fastify.get<GetCurrentUserRoute>('/api/users/me', { schema: schemas.getCurrentUserSchema }, controller.getCurrentUser);
  fastify.get<ListUsersRoute>('/api/users', { schema: schemas.listUsersSchema }, controller.listUsers);
  fastify.get<ListCompaniesRoute>('/api/tenancy/companies', { schema: schemas.listCompaniesSchema }, controller.listCompanies);
  fastify.get<ListCompaniesRoute>('/api/auth/tenants', { schema: schemas.listCompaniesSchema }, controller.listCompanies);
};
