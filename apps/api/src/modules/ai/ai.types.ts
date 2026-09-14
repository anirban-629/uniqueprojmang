export interface AIJobSummaryResult {
  summary: string;
  keyPoints: string[];
  model: string;
  tokensUsed: number;
}

export interface AIJob {
  id: string;
  tenantId: string;
  type: 'summarize_issue' | 'suggest_subtasks' | 'triage_priority';
  issueId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: AIJobSummaryResult | unknown;
  createdAt: string;
}

export interface SummarizeIssueRequestDto {
  issueId: string;
}

export interface SummarizeIssueResponseDto {
  jobId: string;
  status: AIJob['status'];
  result?: AIJobSummaryResult | unknown;
}

export interface GetAIJobParamsDto {
  jobId: string;
}

export interface SummarizeIssueRoute {
  Body: SummarizeIssueRequestDto;
}

export interface GetAIJobRoute {
  Params: GetAIJobParamsDto;
}
