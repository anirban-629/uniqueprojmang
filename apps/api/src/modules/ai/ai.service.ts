import { NotFoundError } from '../../shared/errors/index.js';
import { coreRepository } from '../core/core.repository.js';
import { aiJobQueue, AIJobQueue } from './ai.state.js';
import { executeSummarizeJob } from './ai.worker.js';
import { AIJob, SummarizeIssueResponseDto } from './ai.types.js';

export class AIService {
  constructor(private readonly queue: AIJobQueue = aiJobQueue) {}

  public async summarizeIssue(
    tenantId: string,
    issueId: string
  ): Promise<SummarizeIssueResponseDto> {
    const issue = await coreRepository.getIssueByIdOrKey(issueId);
    if (!issue) {
      throw new NotFoundError(`Issue '${issueId}' not found`);
    }

    const jobId = `job-ai-${Date.now()}`;
    const result = executeSummarizeJob(issue);

    const job: AIJob = {
      id: jobId,
      tenantId,
      type: 'summarize_issue',
      issueId,
      status: 'completed',
      result,
      createdAt: new Date().toISOString()
    };

    this.queue.addJob(job);
    return {
      jobId,
      status: job.status,
      result: job.result
    };
  }

  public getJob(jobId: string): AIJob {
    const job = this.queue.getJob(jobId);
    if (!job) {
      throw new NotFoundError(`AI Job '${jobId}' not found`);
    }
    return job;
  }
}

export const aiService = new AIService();
