import { Issue } from '@flowline/types';
import { AIJobSummaryResult } from './ai.types.js';

export function executeSummarizeJob(issue: Issue): AIJobSummaryResult {
  return {
    summary: `AI Summary: ${issue.title} focuses on ${issue.type} execution with ${issue.priority} priority.`,
    keyPoints: [
      'Requirement breakdown and scope verified.',
      `Assigned to user: ${issue.assigneeId || 'Unassigned'}.`,
      `Estimated effort: ${issue.storyPoints || 0} story points.`
    ],
    model: 'gemini-1.5-flash-free',
    tokensUsed: 142
  };
}
