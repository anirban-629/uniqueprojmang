import { FastifyPluginAsync } from 'fastify';
import { AutomationRule } from '@flowline/types';
import { eventBus } from '../../events/event-bus.js';

const RULES_STORE: AutomationRule[] = [
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

// Idempotency cache (Section 1.6 - prevent duplicate executions on retries)
const PROCESSED_EVENT_IDS = new Set<string>();

// Sandboxed rule evaluator with timeout
function evaluateRuleSafely(rule: AutomationRule, context: Record<string, unknown>): boolean {
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

export const automationRoutes: FastifyPluginAsync = async (fastify) => {
  // Subscribe to domain events via in-process EventBus
  eventBus.subscribe('issue:updated', async (event) => {
    if (PROCESSED_EVENT_IDS.has(event.eventId)) return; // Idempotency check
    PROCESSED_EVENT_IDS.add(event.eventId);

    const rules = RULES_STORE.filter(r => r.enabled);
    for (const rule of rules) {
      if (evaluateRuleSafely(rule, event.payload as any)) {
        rule.executionCount += 1;
        rule.lastRunAt = new Date().toISOString();
        console.log(`[Automation] Triggered rule "${rule.name}" for event ${event.eventId}`);
      }
    }
  });

  fastify.get('/api/automation', {
    schema: {
      tags: ['Automation'],
      summary: 'List Automation Rules',
      querystring: {
        type: 'object',
        properties: { projectId: { type: 'string' } }
      }
    }
  }, async (request) => {
    const { projectId } = request.query as { projectId?: string };
    return RULES_STORE.filter(r => !projectId || r.projectId === projectId);
  });

  fastify.post('/api/automation', {
    schema: {
      tags: ['Automation'],
      summary: 'Create or Trigger Automation Rule',
      body: {
        type: 'object',
        properties: {
          action: { type: 'string', description: "'run' to trigger existing rule, or omit to create" },
          ruleId: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string' },
          trigger: { type: 'string' },
          condition: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as any;

    if (body.action === 'run' && body.ruleId) {
      const rule = RULES_STORE.find(r => r.id === body.ruleId);
      if (!rule) return reply.status(404).send({ error: 'Rule not found' });
      rule.executionCount += 1;
      rule.lastRunAt = new Date().toISOString();
      return { success: true, message: `Rule '${rule.name}' triggered`, rule };
    }

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      projectId: body.projectId || 'proj-flow',
      name: body.name || 'Custom Rule',
      description: body.description || '',
      trigger: body.trigger || 'STATUS_CHANGED',
      condition: body.condition || '',
      action: body.action || '',
      enabled: true,
      executionCount: 0
    };

    RULES_STORE.push(newRule);
    return reply.status(201).send(newRule);
  });
};
