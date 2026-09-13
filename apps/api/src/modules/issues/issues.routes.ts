import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const issuesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/issues — List issues (cursor paginated)
  fastify.get('/api/issues', {
    schema: {
      tags: ['Issues'],
      summary: 'List Issues (Cursor Paginated)',
      description: 'Fetch issues scoped to the active tenant company. Uses monotonic Lexorank and cursor pagination.',
      querystring: {
        type: 'object',
        properties: {
          projectId: { type: 'string', default: 'proj-flow' },
          status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'] },
          sprintId: { type: 'string' },
          assigneeId: { type: 'string' },
          priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
          type: { type: 'string', enum: ['story', 'bug', 'task', 'epic'] },
          search: { type: 'string' },
          cursor: { type: 'string' },
          limit: { type: 'integer', default: 50 },
          chaos: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            nextCursor: { type: ['string', 'null'] },
            totalEstimate: { type: 'integer' },
            meta: {
              type: 'object',
              properties: {
                serverTime: { type: 'integer' },
                latencyMs: { type: 'integer' },
                tenantCompanyId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const query = request.query as any;
    const projectId = query.projectId || 'proj-flow';

    const latency = await mockDb.simulateNetwork({ chaos: query.chaos === true });

    const result = mockDb.queryIssues({
      projectId,
      status: query.status,
      sprintId: query.sprintId,
      assigneeId: query.assigneeId,
      priority: query.priority,
      type: query.type,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : 50
    });

    result.meta.latencyMs = latency;
    (result.meta as any).tenantCompanyId = request.tenant.companyId;

    return reply.send(result);
  });

  // POST /api/issues — Create Issue
  fastify.post('/api/issues', {
    schema: {
      tags: ['Issues'],
      summary: 'Create Issue',
      description: 'Create a new issue inside the tenant space with Lexorank positioning.',
      body: {
        type: 'object',
        required: ['title', 'projectId'],
        properties: {
          title: { type: 'string', example: 'Setup 100% Free-Tier Architecture' },
          projectId: { type: 'string', example: 'proj-flow' },
          description: { type: 'string', example: 'Fastify + Supabase + Swagger at $0 cost' },
          status: { type: 'string', default: 'todo' },
          priority: { type: 'string', default: 'medium' },
          type: { type: 'string', default: 'task' },
          assigneeId: { type: 'string' },
          sprintId: { type: 'string' },
          storyPoints: { type: 'number' },
          labels: { type: 'array', items: { type: 'string' } },
          customFields: { type: 'object' }
        }
      },
      response: {
        201: { type: 'object', additionalProperties: true }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    await mockDb.simulateNetwork();

    const created = mockDb.createIssue({
      ...body,
      reporterId: body.reporterId || request.tenant.userId
    });

    return reply.status(201).send(created);
  });

  // GET /api/issues/:id — Single Issue
  fastify.get('/api/issues/:id', {
    schema: {
      tags: ['Issues'],
      summary: 'Get Issue by ID or Key',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await mockDb.simulateNetwork();

    const issue = mockDb.getIssue(id);
    if (!issue) {
      return reply.status(404).send({ error: 'Issue not found' });
    }

    const comments = mockDb.getComments(issue.id);
    return reply.send({ ...issue, comments });
  });

  // PATCH /api/issues/:id — Update Issue
  fastify.patch('/api/issues/:id', {
    schema: {
      tags: ['Issues'],
      summary: 'Update Issue',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string' },
          assigneeId: { type: ['string', 'null'] },
          rank: { type: 'string' },
          storyPoints: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    await mockDb.simulateNetwork();

    try {
      const updated = mockDb.updateIssue(id, body);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ error: err.message || 'Failed to update issue' });
    }
  });

  // DELETE /api/issues/:id — Soft Delete
  fastify.delete('/api/issues/:id', {
    schema: {
      tags: ['Issues'],
      summary: 'Soft Delete Issue',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const issue = mockDb.getIssue(id);
    if (!issue) {
      return reply.status(404).send({ error: 'Issue not found' });
    }

    (issue as any).deletedAt = new Date().toISOString();
    return reply.send({ success: true, message: 'Issue soft deleted' });
  });
};
