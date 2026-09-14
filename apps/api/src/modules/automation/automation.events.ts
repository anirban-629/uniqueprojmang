import { eventBus } from '../../shared/event-bus.js';
import { automationService } from './automation.service.js';

export function registerAutomationEventListeners(): void {
  eventBus.subscribe('issue:updated', async (event) => {
    automationService.handleIssueUpdatedEvent(event.eventId, event.payload as Record<string, unknown>);
  });
}
