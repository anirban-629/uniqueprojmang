import { AutomationRule } from '@flowline/types';
import { NotFoundError } from '../../shared/errors/index.js';
import { automationRuleStore, AutomationRuleStore } from './automation.state.js';
import { evaluateRuleSafely } from './automation.evaluator.js';
import { CreateOrTriggerAutomationRuleDto, TriggerRuleResult } from './automation.types.js';

export class AutomationService {
  constructor(private readonly store: AutomationRuleStore = automationRuleStore) {}

  public getRules(projectId?: string): AutomationRule[] {
    return this.store.getRules(projectId);
  }

  public triggerRule(ruleId: string): TriggerRuleResult {
    const rule = this.store.getRuleById(ruleId);
    if (!rule) {
      throw new NotFoundError(`Automation rule '${ruleId}' not found`);
    }
    this.store.recordExecution(ruleId);
    return {
      success: true,
      message: `Rule '${rule.name}' triggered`,
      rule
    };
  }

  public createRule(dto: CreateOrTriggerAutomationRuleDto): AutomationRule {
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      projectId: dto.projectId || 'proj-flow',
      name: dto.name || 'Custom Rule',
      description: dto.description || '',
      trigger: dto.trigger || 'STATUS_CHANGED',
      condition: dto.condition || '',
      action: dto.action || '',
      enabled: true,
      executionCount: 0
    };

    this.store.addRule(newRule);
    return newRule;
  }

  public handleIssueUpdatedEvent(eventId: string, payload: Record<string, unknown>): void {
    if (this.store.isEventProcessed(eventId)) {
      return;
    }
    this.store.markEventProcessed(eventId);

    const rules = this.store.getRules().filter(r => r.enabled);
    for (const rule of rules) {
      if (evaluateRuleSafely(rule, payload)) {
        this.store.recordExecution(rule.id);
        console.log(`[Automation] Triggered rule "${rule.name}" for event ${eventId}`);
      }
    }
  }
}

export const automationService = new AutomationService();
