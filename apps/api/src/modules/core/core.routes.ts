import { FastifyPluginAsync } from 'fastify';
import * as controller from './core.controller.js';
import * as schemas from './core.schema.js';
import {
  ListIssuesRoute,
  GetIssueRoute,
  CreateIssueRoute,
  UpdateIssueRoute,
  ListProjectsRoute,
  GetProjectRoute,
  CreateProjectRoute,
  ListSprintsRoute,
  CreateSprintRoute,
  ListCommentsRoute,
  CreateCommentRoute,
  ListDecisionsRoute
} from './core.types.js';

export const coreRoutes: FastifyPluginAsync = async (fastify) => {
  // Issues
  fastify.get<ListIssuesRoute>('/api/issues', { schema: schemas.listIssuesSchema }, controller.listIssues);
  fastify.get<GetIssueRoute>('/api/issues/:id', { schema: schemas.getIssueSchema }, controller.getIssueById);
  fastify.post<CreateIssueRoute>('/api/issues', { schema: schemas.createIssueSchema }, controller.createIssue);
  fastify.patch<UpdateIssueRoute>('/api/issues/:id', { schema: schemas.updateIssueSchema }, controller.updateIssue);

  // Projects
  fastify.get<ListProjectsRoute>('/api/projects', { schema: schemas.listProjectsSchema }, controller.listProjects);
  fastify.get<GetProjectRoute>('/api/projects/:id', { schema: schemas.getProjectSchema }, controller.getProjectById);
  fastify.post<CreateProjectRoute>('/api/projects', { schema: schemas.createProjectSchema }, controller.createProject);

  // Sprints
  fastify.get<ListSprintsRoute>('/api/sprints', { schema: schemas.listSprintsSchema }, controller.listSprints);
  fastify.post<CreateSprintRoute>('/api/sprints', { schema: schemas.createSprintSchema }, controller.createSprint);

  // Comments
  fastify.get<ListCommentsRoute>('/api/comments', { schema: schemas.listCommentsSchema }, controller.listComments);
  fastify.post<CreateCommentRoute>('/api/comments', { schema: schemas.createCommentSchema }, controller.createComment);

  // Decisions
  fastify.get<ListDecisionsRoute>('/api/decisions', { schema: schemas.listDecisionsSchema }, controller.listDecisions);
};
