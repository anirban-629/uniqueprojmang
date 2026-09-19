import { FastifySchema } from 'fastify';

export const listIssuesSchema: FastifySchema = {
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
};

export const getIssueSchema: FastifySchema = {
  tags: ['Core — Issues'],
  summary: 'Get Issue by ID or Key',
  params: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id']
  }
};

export const createIssueSchema: FastifySchema = {
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
};

export const updateIssueSchema: FastifySchema = {
  tags: ['Core — Issues'],
  summary: 'Update Issue Fields / Move Column',
  params: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id']
  }
};

export const listProjectsSchema: FastifySchema = {
  tags: ['Core — Projects'],
  summary: 'List Projects'
};

export const getProjectSchema: FastifySchema = {
  tags: ['Core — Projects'],
  summary: 'Get Project by ID or Key',
  params: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id']
  }
};

export const createProjectSchema: FastifySchema = {
  tags: ['Core — Projects'],
  summary: 'Create a New Project',
  body: {
    type: 'object',
    required: ['name', 'key'],
    properties: {
      key: { type: 'string', minLength: 2, maxLength: 10 },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string' },
      color: { type: 'string' },
      leadId: { type: 'string' }
    }
  }
};

export const createSprintSchema: FastifySchema = {
  tags: ['Core — Sprints'],
  summary: 'Create a Sprint',
  body: {
    type: 'object',
    required: ['projectId', 'name'],
    properties: {
      projectId: { type: 'string' },
      name: { type: 'string' },
      goal: { type: 'string' },
      startDate: { type: 'string' },
      endDate: { type: 'string' }
    }
  }
};

export const listSprintsSchema: FastifySchema = {
  tags: ['Core — Sprints'],
  summary: 'List Sprints by Project',
  querystring: {
    type: 'object',
    properties: { projectId: { type: 'string' } }
  }
};

export const listCommentsSchema: FastifySchema = {
  tags: ['Core — Comments'],
  summary: 'List Comments for an Issue',
  querystring: {
    type: 'object',
    properties: { issueId: { type: 'string' } },
    required: ['issueId']
  }
};

export const createCommentSchema: FastifySchema = {
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
};

export const listDecisionsSchema: FastifySchema = {
  tags: ['Core — Decisions'],
  summary: 'List Architecture Decision Records (ADRs)',
  querystring: {
    type: 'object',
    properties: { projectId: { type: 'string', default: 'proj-flow' } }
  }
};
