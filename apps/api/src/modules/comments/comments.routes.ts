import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const commentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/comments', {
    schema: {
      tags: ['Comments'],
      summary: 'List Comments for an Issue',
      querystring: {
        type: 'object',
        required: ['issueId'],
        properties: {
          issueId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { issueId } = request.query as { issueId: string };
    const comments = mockDb.getComments(issueId);
    return reply.send(comments);
  });

  fastify.post('/api/comments', {
    schema: {
      tags: ['Comments'],
      summary: 'Add Comment to Issue',
      body: {
        type: 'object',
        required: ['issueId', 'body'],
        properties: {
          issueId: { type: 'string' },
          body: { type: 'string', example: 'Verified RLS isolation on Supabase.' },
          authorId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    const authorId = body.authorId || request.tenant.userId;
    const comment = mockDb.addComment(body.issueId, authorId, body.body);
    return reply.status(201).send(comment);
  });
};
