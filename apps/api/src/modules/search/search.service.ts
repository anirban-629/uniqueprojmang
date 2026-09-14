import { searchRepository, SearchRepository } from './search.repository.js';
import { SearchIssuesQueryDto, SearchIssuesResponseDto } from './search.types.js';

export class SearchService {
  constructor(private readonly repository: SearchRepository = searchRepository) {}

  public async searchIssues(dto: SearchIssuesQueryDto): Promise<SearchIssuesResponseDto> {
    const projectId = dto.projectId || 'proj-flow';
    const limit = dto.limit ? Number(dto.limit) : 20;

    await this.repository.simulateNetwork();

    const results = this.repository.searchIssues({
      projectId,
      search: dto.q,
      limit
    });

    return {
      query: dto.q,
      engine: 'postgres-native (tsvector + pg_trgm)',
      totalMatches: results.data.length,
      results: results.data
    };
  }
}

export const searchService = new SearchService();
