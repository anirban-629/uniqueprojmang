import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const sprintsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/sprints', {
    schema: {
      tags: ['Sprints'],
      summary: 'List Sprints for Project',
      querystring: {
        type: 'object',
        properties: {
          projectId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };
    const sprints = mockDb.getSprints(projectId);
    return reply.send(sprints);
  });

  fastify.post('/api/sprints', {
    schema: {
      tags: ['Sprints'],
      summary: 'Create Sprint',
      body: {
        type: 'object',
        required: ['projectId', 'name'],
        properties: {
          projectId: { type: 'string', example: 'proj-flow' },
          name: { type: 'string', example: 'Sprint 25: Performance' },
          goal: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['future', 'active', 'closed'], default: 'future' },
          totalPoints: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    const newSprint = {
      id: `spr-${Date.now()}`,
      projectId: body.projectId,
      name: body.name,
      goal: body.goal || '',
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      status: body.status || 'future',
      totalPoints: body.totalPoints || 0,
      completedPoints: 0
    };

    (mockDb as any).sprints.set(newSprint.id, newSprint);
    return reply.status(201).send(newSprint);
  });
};
