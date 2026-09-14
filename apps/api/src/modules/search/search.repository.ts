import { mockDb } from '@flowline/mock-db';
import { Issue } from '@flowline/types';

export class SearchRepository {
  public async simulateNetwork(): Promise<number> {
    return mockDb.simulateNetwork();
  }

  public searchIssues(query: { projectId: string; search: string; limit: number }): { data: Issue[] } {
    return mockDb.queryIssues({
      projectId: query.projectId,
      search: query.search,
      limit: query.limit
    });
  }
}

export const searchRepository = new SearchRepository();
