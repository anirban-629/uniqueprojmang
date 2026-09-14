import { AutomationRule } from '@flowline/types';

export class AutomationRuleStore {
  private rules: AutomationRule[] = [
    {
      id: 'rule-1',
      projectId: 'proj-flow',
      name: 'Auto-assign Tech Lead on Urgent Priority',
      description: 'When an issue priority is set to urgent, automatically set assignee to Tech Lead',
      trigger: 'STATUS_CHANGED',
      condition: 'priority == "urgent"',
      action: 'assign(tech_lead)',
      enabled: true,
      executionCount: 142,
      lastRunAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'rule-2',
      projectId: 'proj-flow',
      name: 'SLA Breach 24h Escalation',
      description: 'Escalate tickets stagnant in review for > 24 hours',
      trigger: 'STATUS_CHANGED',
      condition: 'status == "in_review" && hoursInState > 24',
      action: 'escalate_slack()',
      enabled: true,
      executionCount: 28,
      lastRunAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  private processedEventIds = new Set<string>();

  public getRules(projectId?: string): AutomationRule[] {
    return this.rules.filter(r => !projectId || r.projectId === projectId);
  }

  public getRuleById(id: string): AutomationRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  public addRule(rule: AutomationRule): void {
    this.rules.push(rule);
  }

  public recordExecution(ruleId: string): void {
    const rule = this.getRuleById(ruleId);
    if (rule) {
      rule.executionCount += 1;
      rule.lastRunAt = new Date().toISOString();
    }
  }

  public isEventProcessed(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  public markEventProcessed(eventId: string): void {
    this.processedEventIds.add(eventId);
  }
}

export const automationRuleStore = new AutomationRuleStore();
