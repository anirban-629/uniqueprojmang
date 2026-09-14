import { AIJob } from './ai.types.js';

export class AIJobQueue {
  private jobs = new Map<string, AIJob>();

  public addJob(job: AIJob): void {
    this.jobs.set(job.id, job);
  }

  public getJob(jobId: string): AIJob | undefined {
    return this.jobs.get(jobId);
  }

  public updateJobStatus(
    jobId: string,
    status: AIJob['status'],
    result?: unknown
  ): AIJob | undefined {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (result !== undefined) {
        job.result = result;
      }
    }
    return job;
  }

  public clear(): void {
    this.jobs.clear();
  }
}

export const aiJobQueue = new AIJobQueue();
