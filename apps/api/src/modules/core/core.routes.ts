import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';
import { eventBus } from '../../events/event-bus.js';

export const coreRoutes: FastifyPluginAsync = async (fastify) => {
  // -------------------------------------------------------------
  // ISSUES
  // -------------------------------------------------------------
  fastify.get('/api/issues', {
    schema: {
      tags: ['Core — Issues'],
      summary: 'List Issues (Cursor Paginated)',
      description: 'Fetch issues scoped to the active tenant. Uses monotonic Lexorank and cursor pagination.',
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
      }
    }
  }, async (request) => {
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

    return {
      ...result,
      meta: {
        serverTime: Date.now(),
        latencyMs: latency,
        tenantId: request.companyTenant?.tenantId || 'acme-corp'
      }
    };
  });

  fastify.get('/api/issues/:id', {
    schema: {
      tags: ['Core — Issues'],
      summary: 'Get Issue by ID or Key',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await mockDb.simulateNetwork();
    const issue = mockDb.getIssueByIdOrKey(id);
    if (!issue) {
      return reply.status(404).send({ error: 'Issue not found' });
    }
    return issue;
  });

  fastify.post('/api/issues', {
    schema: {
      tags: ['Core — Issues'],
      summary: 'Create Issue',
      body: {
        type: 'object',
        required: ['projectId', 'title', 'type', 'priority'],
        properties: {
          projectId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', default: 'todo' },
          priority: { type: 'string' },
          type: { type: 'string' },
          assigneeId: { type: 'string' },
          sprintId: { type: 'string' },
          storyPoints: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;
    await mockDb.simulateNetwork();
    const newIssue = mockDb.createIssue({
      ...body,
      reporterId: 'usr-alex'
    });

    // Publish domain event
    eventBus.publish({
      eventId: `evt-${Date.now()}`,
      tenantId: request.companyTenant?.tenantId || 'acme-corp',
      eventName: 'issue:created',
      occurredAt: new Date().toISOString(),
      payload: {
        issueId: newIssue.id,
        key: newIssue.key,
        projectId: newIssue.projectId,
        title: newIssue.title,
        reporterId: newIssue.reporterId
      }
    });

    return reply.status(201).send(newIssue);
  });

  fastify.patch('/api/issues/:id', {
    schema: {
      tags: ['Core — Issues'],
      summary: 'Update Issue Fields / Move Column',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as any;
    await mockDb.simulateNetwork();

    const updated = mockDb.updateIssue(id, updates);
    if (!updated) {
      return reply.status(404).send({ error: 'Issue not found' });
    }

    // Publish domain event
    eventBus.publish({
      eventId: `evt-${Date.now()}`,
      tenantId: request.companyTenant?.tenantId || 'acme-corp',
      eventName: 'issue:updated',
      occurredAt: new Date().toISOString(),
      payload: {
        issueId: updated.id,
        key: updated.key,
        projectId: updated.projectId,
        changes: updates
      }
    });

    return updated;
  });

  // -------------------------------------------------------------
  // PROJECTS
  // -------------------------------------------------------------
  fastify.get('/api/projects', {
    schema: {
      tags: ['Core — Projects'],
      summary: 'List Projects'
    }
  }, async () => {
    await mockDb.simulateNetwork();
    return mockDb.getProjects();
  });

  // -------------------------------------------------------------
  // SPRINTS
  // -------------------------------------------------------------
  fastify.get('/api/sprints', {
    schema: {
      tags: ['Core — Sprints'],
      summary: 'List Sprints by Project',
      querystring: {
        type: 'object',
        properties: { projectId: { type: 'string', default: 'proj-flow' } }
      }
    }
  }, async (request) => {
    const { projectId = 'proj-flow' } = request.query as any;
    await mockDb.simulateNetwork();
    return mockDb.getSprints(projectId);
  });

  // -------------------------------------------------------------
  // COMMENTS
  // -------------------------------------------------------------
  fastify.get('/api/comments', {
    schema: {
      tags: ['Core — Comments'],
      summary: 'List Comments for an Issue',
      querystring: {
        type: 'object',
        properties: { issueId: { type: 'string' } },
        required: ['issueId']
      }
    }
  }, async (request) => {
    const { issueId } = request.query as any;
    await mockDb.simulateNetwork();
    return mockDb.getComments(issueId);
  });

  fastify.post('/api/comments', {
    schema: {
      tags: ['Core — Comments'],
      summary: 'Add a Comment to an Issue',
      body: {
        type: 'object',
        required: ['issueId', 'body'],
        properties: {
          issueId: { type: 'string' },
          body: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { issueId, body } = request.body as any;
    await mockDb.simulateNetwork();
    const comment = mockDb.addComment(issueId, 'usr-alex', body);

    eventBus.publish({
      eventId: `evt-${Date.now()}`,
      tenantId: request.companyTenant?.tenantId || 'acme-corp',
      eventName: 'comment:added',
      occurredAt: new Date().toISOString(),
      payload: { issueId, commentId: comment.id, authorId: comment.authorId }
    });

    return reply.status(201).send(comment);
  });

  // -------------------------------------------------------------
  // DECISIONS (ADRs in-app)
  // -------------------------------------------------------------
  fastify.get('/api/decisions', {
    schema: {
      tags: ['Core — Decisions'],
      summary: 'List Architecture Decision Records (ADRs)',
      querystring: {
        type: 'object',
        properties: { projectId: { type: 'string', default: 'proj-flow' } }
      }
    }
  }, async (request) => {
    const { projectId = 'proj-flow' } = request.query as any;
    await mockDb.simulateNetwork();
    return mockDb.getDecisions(projectId);
  });
};
