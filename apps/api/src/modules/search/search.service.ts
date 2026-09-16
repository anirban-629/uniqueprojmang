import { searchRepository, SearchRepository } from './search.repository.js';
import { SearchIssuesQueryDto, SearchIssuesResponseDto } from './search.types.js';

export class SearchService {
  constructor(private readonly repository: SearchRepository = searchRepository) {}

  public async searchIssues(dto: SearchIssuesQueryDto): Promise<SearchIssuesResponseDto> {
    const limit = dto.limit ? Number(dto.limit) : 20;

    const results = await this.repository.searchIssues({
      projectId: dto.projectId,
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
