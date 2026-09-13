import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/users', {
    schema: {
      tags: ['Users'],
      summary: 'List Workspace Users',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              avatar: { type: 'string' },
              role: { type: 'string' },
              teamId: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (_request, reply) => {
    return reply.send(mockDb.getUsers());
  });
};
