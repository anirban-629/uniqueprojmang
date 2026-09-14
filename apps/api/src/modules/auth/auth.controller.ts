import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { ListUsersRoute, GetCurrentUserRoute, ListCompaniesRoute } from './auth.types.js';

export async function listUsers(
  _request: FastifyRequest<ListUsersRoute>,
  reply: FastifyReply
) {
  const users = await authService.getUsers();
  return reply.send(users);
}

export async function getCurrentUser(
  request: FastifyRequest<GetCurrentUserRoute>,
  reply: FastifyReply
) {
  const result = await authService.getCurrentUserContext(request.companyTenant);
  return reply.send(result);
}

export async function listCompanies(
  _request: FastifyRequest<ListCompaniesRoute>,
  reply: FastifyReply
) {
  const companies = await authService.getCompanies();
  return reply.send(companies);
}
