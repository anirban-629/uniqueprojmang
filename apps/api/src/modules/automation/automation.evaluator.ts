import { AutomationRule } from '@flowline/types';

export function evaluateRuleSafely(rule: AutomationRule, context: Record<string, unknown>): boolean {
  if (!rule.enabled) return false;
  try {
    // Simple restricted expression evaluation (no eval)
    if (rule.condition.includes('urgent') && (context as any).priority === 'urgent') return true;
    if (rule.condition.includes('in_review') && (context as any).status === 'in_review') return true;
    return true;
  } catch (err) {
    console.error(`[Automation] Rule evaluation failed for ${rule.id}:`, err);
    return false;
  }
}
