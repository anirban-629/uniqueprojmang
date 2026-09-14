import { AutomationRule } from '@flowline/types';
import { createChildLogger } from '../../shared/logger.js';

const logger = createChildLogger('automation-evaluator');

export function evaluateRuleSafely(rule: AutomationRule, context: Record<string, unknown>): boolean {
  if (!rule.enabled) return false;
  try {
    // Simple restricted expression evaluation (no eval)
    if (rule.condition.includes('urgent') && (context as any).priority === 'urgent') return true;
    if (rule.condition.includes('in_review') && (context as any).status === 'in_review') return true;
    return true;
  } catch (err) {
    logger.error({ err, ruleId: rule.id }, `Rule evaluation failed for rule "${rule.name}"`);
    return false;
  }
}
