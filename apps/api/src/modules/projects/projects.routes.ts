import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/projects', {
    schema: {
      tags: ['Projects'],
      summary: 'List or Get Projects (Spaces)',
      querystring: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Optional project ID or key' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.query as { id?: string };
    if (id) {
      const proj = mockDb.getProject(id);
      if (!proj) return reply.status(404).send({ error: 'Project not found' });
      return reply.send(proj);
    }
    return reply.send(mockDb.getProjects());
  });

  fastify.post('/api/projects', {
    schema: {
      tags: ['Projects'],
      summary: 'Create Project (Space)',
      body: {
        type: 'object',
        required: ['key', 'name'],
        properties: {
          key: { type: 'string', example: 'API' },
          name: { type: 'string', example: 'API Service' },
          description: { type: 'string' },
          color: { type: 'string', default: '#3b82f6' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    const newProject = {
      id: `proj-${body.key.toLowerCase()}`,
      key: body.key.toUpperCase(),
      name: body.name,
      description: body.description || '',
      leadId: request.tenant.userId,
      memberCount: 1,
      color: body.color || '#3b82f6',
      createdAt: new Date().toISOString()
    };

    (mockDb as any).projects.set(newProject.id, newProject);
    return reply.status(201).send(newProject);
  });
};
