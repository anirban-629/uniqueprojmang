import { FastifyRequest, FastifyReply } from 'fastify';
import { coreService } from './core.service.js';
import {
  ListIssuesRoute,
  GetIssueRoute,
  CreateIssueRoute,
  UpdateIssueRoute,
  ListProjectsRoute,
  ListSprintsRoute,
  ListCommentsRoute,
  CreateCommentRoute,
  ListDecisionsRoute
} from './core.types.js';

export async function listIssues(
  request: FastifyRequest<ListIssuesRoute>,
  reply: FastifyReply
) {
  const tenantId = request.companyTenant?.tenantId || 'acme-corp';
  const result = await coreService.listIssues(tenantId, request.query);
  return reply.send(result);
}

export async function getIssueById(
  request: FastifyRequest<GetIssueRoute>,
  reply: FastifyReply
) {
  const issue = await coreService.getIssueByIdOrKey(request.params.id);
  return reply.send(issue);
}

export async function createIssue(
  request: FastifyRequest<CreateIssueRoute>,
  reply: FastifyReply
) {
  const tenantId = request.companyTenant?.tenantId || 'acme-corp';
  const reporterId = request.companyTenant?.userId || 'usr-alex';
  const newIssue = await coreService.createIssue(tenantId, reporterId, request.body);
  return reply.status(201).send(newIssue);
}

export async function updateIssue(
  request: FastifyRequest<UpdateIssueRoute>,
  reply: FastifyReply
) {
  const tenantId = request.companyTenant?.tenantId || 'acme-corp';
  const updated = await coreService.updateIssue(tenantId, request.params.id, request.body);
  return reply.send(updated);
}

export async function listProjects(
  _request: FastifyRequest<ListProjectsRoute>,
  reply: FastifyReply
) {
  const projects = await coreService.getProjects();
  return reply.send(projects);
}

export async function listSprints(
  request: FastifyRequest<ListSprintsRoute>,
  reply: FastifyReply
) {
  const sprints = await coreService.getSprints(request.query.projectId);
  return reply.send(sprints);
}

export async function listComments(
  request: FastifyRequest<ListCommentsRoute>,
  reply: FastifyReply
) {
  const comments = await coreService.getComments(request.query.issueId);
  return reply.send(comments);
}

export async function createComment(
  request: FastifyRequest<CreateCommentRoute>,
  reply: FastifyReply
) {
  const tenantId = request.companyTenant?.tenantId || 'acme-corp';
  const authorId = request.companyTenant?.userId || 'usr-alex';
  const comment = await coreService.addComment(
    tenantId,
    request.body.issueId,
    authorId,
    request.body.body
  );
  return reply.status(201).send(comment);
}

export async function listDecisions(
  request: FastifyRequest<ListDecisionsRoute>,
  reply: FastifyReply
) {
  const decisions = await coreService.getDecisions(request.query.projectId);
  return reply.send(decisions);
}
