import { AutomationRule } from '@flowline/types';

export interface ListAutomationRulesQueryDto {
  projectId?: string;
}

export interface CreateOrTriggerAutomationRuleDto {
  action?: string;
  ruleId?: string;
  projectId?: string;
  name?: string;
  description?: string;
  trigger?: 'STATUS_CHANGED' | 'ISSUE_CREATED' | 'BLOCKER_ADDED';
  condition?: string;
}

export interface TriggerRuleResult {
  success: boolean;
  message: string;
  rule: AutomationRule;
}

export interface ListAutomationRulesRoute {
  Querystring: ListAutomationRulesQueryDto;
}

export interface CreateOrTriggerAutomationRuleRoute {
  Body: CreateOrTriggerAutomationRuleDto;
}
