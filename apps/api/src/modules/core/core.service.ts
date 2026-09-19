import { Issue, Project, Sprint, Comment, DecisionRecord } from '@flowline/types';
import { NotFoundError } from '../../shared/errors/index.js';
import { coreRepository, CoreRepository } from './core.repository.js';
import { coreEvents, CoreEvents } from './core.events.js';
import {
  ListIssuesQueryDto,
  CreateIssueDto,
  UpdateIssueDto,
  CreateProjectDto,
  CreateSprintDto,
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
    const startTime = Date.now();
    const result = await this.repository.queryIssues({
      projectId: query.projectId || '',
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
        latencyMs: Date.now() - startTime,
        tenantId
      }
    };
  }

  public async getIssueByIdOrKey(idOrKey: string): Promise<Issue> {
    const issue = await this.repository.getIssueByIdOrKey(idOrKey);
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
    const newIssue = await this.repository.createIssue(tenantId, {
      ...dto,
      reporterId: reporterId || '10000000-0000-0000-0000-000000000001'
    });

    this.events.publishIssueCreated(tenantId, newIssue);
    return newIssue;
  }

  public async updateIssue(
    tenantId: string,
    id: string,
    updates: UpdateIssueDto
  ): Promise<Issue> {
    const updated = await this.repository.updateIssue(id, updates);
    if (!updated) {
      throw new NotFoundError(`Issue '${id}' not found`);
    }

    this.events.publishIssueUpdated(tenantId, updated, updates);
    return updated;
  }

  public async getProjects(tenantId?: string): Promise<Project[]> {
    return this.repository.getProjects(tenantId);
  }

  public async getProjectByIdOrKey(idOrKey: string, tenantId?: string): Promise<Project> {
    const project = await this.repository.getProjectByIdOrKey(idOrKey, tenantId);
    if (!project) {
      throw new NotFoundError(`Project '${idOrKey}' not found`);
    }
    return project;
  }

  public async createProject(
    tenantId: string,
    leadId: string,
    data: CreateProjectDto
  ): Promise<Project> {
    return this.repository.createProject(tenantId, leadId, data);
  }

  public async createSprint(
    tenantId: string,
    data: CreateSprintDto
  ): Promise<Sprint> {
    return this.repository.createSprint(tenantId, data);
  }

  public async getSprints(projectId?: string): Promise<Sprint[]> {
    return this.repository.getSprints(projectId);
  }

  public async getComments(issueId: string): Promise<Comment[]> {
    return this.repository.getComments(issueId);
  }

  public async addComment(
    tenantId: string,
    issueId: string,
    authorId: string,
    body: string
  ): Promise<Comment> {
    const comment = await this.repository.addComment(
      tenantId,
      issueId,
      authorId || '10000000-0000-0000-0000-000000000001',
      body
    );
    this.events.publishCommentAdded(tenantId, issueId, comment);
    return comment;
  }

  public async getDecisions(projectId?: string): Promise<DecisionRecord[]> {
    return this.repository.getDecisions(projectId);
  }
}

export const coreService = new CoreService();
