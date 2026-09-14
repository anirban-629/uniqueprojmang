import { eventBus } from '../../shared/event-bus.js';
import { Issue, Comment } from '@flowline/types';
import { UpdateIssueDto } from './core.types.js';

export interface IssueCreatedEventPayload {
  issueId: string;
  key: string;
  projectId: string;
  title: string;
  reporterId: string;
}

export interface IssueUpdatedEventPayload {
  issueId: string;
  key: string;
  projectId: string;
  changes: UpdateIssueDto;
}

export interface CommentAddedEventPayload {
  issueId: string;
  commentId: string;
  authorId: string;
}

export class CoreEvents {
  public publishIssueCreated(tenantId: string, issue: Issue): void {
    eventBus.publish<IssueCreatedEventPayload>({
      eventId: `evt-${Date.now()}`,
      tenantId,
      eventName: 'issue:created',
      occurredAt: new Date().toISOString(),
      payload: {
        issueId: issue.id,
        key: issue.key,
        projectId: issue.projectId,
        title: issue.title,
        reporterId: issue.reporterId
      }
    });
  }

  public publishIssueUpdated(tenantId: string, issue: Issue, changes: UpdateIssueDto): void {
    eventBus.publish<IssueUpdatedEventPayload>({
      eventId: `evt-${Date.now()}`,
      tenantId,
      eventName: 'issue:updated',
      occurredAt: new Date().toISOString(),
      payload: {
        issueId: issue.id,
        key: issue.key,
        projectId: issue.projectId,
        changes
      }
    });
  }

  public publishCommentAdded(tenantId: string, issueId: string, comment: Comment): void {
    eventBus.publish<CommentAddedEventPayload>({
      eventId: `evt-${Date.now()}`,
      tenantId,
      eventName: 'comment:added',
      occurredAt: new Date().toISOString(),
      payload: {
        issueId,
        commentId: comment.id,
        authorId: comment.authorId
      }
    });
  }
}

export const coreEvents = new CoreEvents();
