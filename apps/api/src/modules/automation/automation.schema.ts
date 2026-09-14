import { FastifySchema } from 'fastify';

export const listAutomationRulesSchema: FastifySchema = {
  tags: ['Automation'],
  summary: 'List Automation Rules',
  querystring: {
    type: 'object',
    properties: { projectId: { type: 'string' } }
  }
};

export const createOrTriggerRuleSchema: FastifySchema = {
  tags: ['Automation'],
  summary: 'Create or Trigger Automation Rule',
  body: {
    type: 'object',
    properties: {
      action: { type: 'string', description: "'run' to trigger existing rule, or omit to create" },
      ruleId: { type: 'string' },
      projectId: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      trigger: { type: 'string' },
      condition: { type: 'string' }
    }
  }
};
