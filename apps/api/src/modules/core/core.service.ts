import { Issue, Project, Sprint, Comment, DecisionRecord } from '@flowline/types';
import { NotFoundError } from '../../shared/errors/index.js';
import { coreRepository, CoreRepository } from './core.repository.js';
import { coreEvents, CoreEvents } from './core.events.js';
import {
  ListIssuesQueryDto,
  CreateIssueDto,
  UpdateIssueDto,
  PaginatedIssuesResponse
} from './core.types.js';

export class CoreService {
  constructor(
    private readonly repository: CoreRepository = coreRepository,
    private readonly events: CoreEvents = coreEvents
  ) {}

  public async listIssues(
    tenantId: string,
    query: ListIssuesQueryDto
  ): Promise<PaginatedIssuesResponse> {
    const projectId = query.projectId || 'proj-flow';
    const latency = await this.repository.simulateNetwork({ chaos: query.chaos === true });

    const result = this.repository.queryIssues({
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
        tenantId
      }
    };
  }

  public async getIssueByIdOrKey(idOrKey: string): Promise<Issue> {
    await this.repository.simulateNetwork();
    const issue = this.repository.getIssueByIdOrKey(idOrKey);
    if (!issue) {
      throw new NotFoundError(`Issue '${idOrKey}' not found`);
    }
    return issue;
  }

  public async createIssue(
    tenantId: string,
    reporterId: string,
    dto: CreateIssueDto
  ): Promise<Issue> {
    await this.repository.simulateNetwork();
    const newIssue = this.repository.createIssue({
      ...dto,
      reporterId: reporterId || 'usr-alex'
    });

    this.events.publishIssueCreated(tenantId, newIssue);
    return newIssue;
  }

  public async updateIssue(
    tenantId: string,
    id: string,
    updates: UpdateIssueDto
  ): Promise<Issue> {
    await this.repository.simulateNetwork();
    const updated = this.repository.updateIssue(id, updates);
    if (!updated) {
      throw new NotFoundError(`Issue '${id}' not found`);
    }

    this.events.publishIssueUpdated(tenantId, updated, updates);
    return updated;
  }

  public async getProjects(): Promise<Project[]> {
    await this.repository.simulateNetwork();
    return this.repository.getProjects();
  }

  public async getSprints(projectId = 'proj-flow'): Promise<Sprint[]> {
    await this.repository.simulateNetwork();
    return this.repository.getSprints(projectId);
  }

  public async getComments(issueId: string): Promise<Comment[]> {
    await this.repository.simulateNetwork();
    return this.repository.getComments(issueId);
  }

  public async addComment(
    tenantId: string,
    issueId: string,
    authorId: string,
    body: string
  ): Promise<Comment> {
    await this.repository.simulateNetwork();
    const comment = this.repository.addComment(issueId, authorId || 'usr-alex', body);
    this.events.publishCommentAdded(tenantId, issueId, comment);
    return comment;
  }

  public async getDecisions(projectId = 'proj-flow'): Promise<DecisionRecord[]> {
    await this.repository.simulateNetwork();
    return this.repository.getDecisions(projectId);
  }
}

export const coreService = new CoreService();
