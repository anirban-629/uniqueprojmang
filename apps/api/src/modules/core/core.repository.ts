import { mockDb } from '@flowline/mock-db';
import { Issue, Project, Sprint, Comment, DecisionRecord, IssuesQueryParams } from '@flowline/types';
import { CreateIssueDto, UpdateIssueDto } from './core.types.js';

export class CoreRepository {
  public async simulateNetwork(options?: { chaos?: boolean }): Promise<number> {
    return mockDb.simulateNetwork(options);
  }

  public queryIssues(params: IssuesQueryParams) {
    return mockDb.queryIssues(params);
  }

  public getIssueByIdOrKey(idOrKey: string): Issue | undefined {
    return mockDb.getIssueByIdOrKey(idOrKey);
  }

  public createIssue(data: CreateIssueDto & { reporterId: string }): Issue {
    return mockDb.createIssue({
      ...data,
      status: data.status || 'todo',
      description: data.description || '',
      labels: data.labels || []
    });
  }

  public updateIssue(id: string, updates: UpdateIssueDto): Issue | null {
    return mockDb.updateIssue(id, updates);
  }

  public getProjects(): Project[] {
    return mockDb.getProjects();
  }

  public getSprints(projectId: string): Sprint[] {
    return mockDb.getSprints(projectId);
  }

  public getComments(issueId: string): Comment[] {
    return mockDb.getComments(issueId);
  }

  public addComment(issueId: string, authorId: string, body: string): Comment {
    return mockDb.addComment(issueId, authorId, body);
  }

  public getDecisions(projectId: string): DecisionRecord[] {
    return mockDb.getDecisions(projectId);
  }
}

export const coreRepository = new CoreRepository();
