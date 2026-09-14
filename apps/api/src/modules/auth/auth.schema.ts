import { FastifySchema } from 'fastify';

export const listUsersSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'List Workspace Users',
  description: 'Get list of users in the active company.'
};

export const getCurrentUserSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Get Current Authenticated User Context'
};

export const listCompaniesSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'List Available Companies (Multi-Tenant)'
};
