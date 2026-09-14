import { Issue, Project, Sprint, Comment, DecisionRecord, IssuePriority, IssueStatus, IssueType, PaginatedResponse } from '@flowline/types';
import { ApiResponseMeta } from '../../shared/types/index.js';

export interface ListIssuesQueryDto {
  projectId?: string;
  status?: IssueStatus;
  sprintId?: string;
  assigneeId?: string;
  priority?: IssuePriority;
  type?: IssueType;
  search?: string;
  cursor?: string;
  limit?: number;
  chaos?: boolean;
}

export interface GetIssueParamsDto {
  id: string;
}

export interface CreateIssueDto {
  projectId: string;
  title: string;
  description?: string;
  status?: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  assigneeId?: string;
  sprintId?: string;
  storyPoints?: number;
  labels?: string[];
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  sprintId?: string;
  storyPoints?: number;
  rank?: string;
  labels?: string[];
  blockerIds?: string[];
  blockedByIds?: string[];
}

export interface ListSprintsQueryDto {
  projectId?: string;
}

export interface ListCommentsQueryDto {
  issueId: string;
}

export interface CreateCommentDto {
  issueId: string;
  body: string;
}

export interface ListDecisionsQueryDto {
  projectId?: string;
}

export interface PaginatedIssuesResponse extends PaginatedResponse<Issue> {
  meta: ApiResponseMeta;
}

// Route Type Shapes for Fastify Generics
export interface ListIssuesRoute {
  Querystring: ListIssuesQueryDto;
}

export interface GetIssueRoute {
  Params: GetIssueParamsDto;
}

export interface CreateIssueRoute {
  Body: CreateIssueDto;
}

export interface UpdateIssueRoute {
  Params: GetIssueParamsDto;
  Body: UpdateIssueDto;
}

export interface ListProjectsRoute {}

export interface ListSprintsRoute {
  Querystring: ListSprintsQueryDto;
}

export interface ListCommentsRoute {
  Querystring: ListCommentsQueryDto;
}

export interface CreateCommentRoute {
  Body: CreateCommentDto;
}

export interface ListDecisionsRoute {
  Querystring: ListDecisionsQueryDto;
}
