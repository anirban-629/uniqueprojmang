import { Issue } from '@flowline/types';

export interface SearchIssuesQueryDto {
  q: string;
  projectId?: string;
  limit?: number;
}

export interface SearchIssuesResponseDto {
  query: string;
  engine: string;
  totalMatches: number;
  results: Issue[];
}

export interface SearchIssuesRoute {
  Querystring: SearchIssuesQueryDto;
}
