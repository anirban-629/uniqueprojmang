import { FastifyPluginAsync } from 'fastify';
import * as controller from './auth.controller.js';
import * as schemas from './auth.schema.js';
import { ListUsersRoute, GetCurrentUserRoute, ListCompaniesRoute } from './auth.types.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<ListUsersRoute>('/api/users', { schema: schemas.listUsersSchema }, controller.listUsers);
  fastify.get<GetCurrentUserRoute>('/api/users/me', { schema: schemas.getCurrentUserSchema }, controller.getCurrentUser);
  fastify.get<ListCompaniesRoute>('/api/tenancy/companies', { schema: schemas.listCompaniesSchema }, controller.listCompanies);
};
