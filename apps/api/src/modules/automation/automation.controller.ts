import { FastifyRequest, FastifyReply } from 'fastify';
import { automationService } from './automation.service.js';
import {
  ListAutomationRulesRoute,
  CreateOrTriggerAutomationRuleRoute
} from './automation.types.js';

export async function listRules(
  request: FastifyRequest<ListAutomationRulesRoute>,
  reply: FastifyReply
) {
  const rules = automationService.getRules(request.query.projectId);
  return reply.send(rules);
}

export async function createOrTriggerRule(
  request: FastifyRequest<CreateOrTriggerAutomationRuleRoute>,
  reply: FastifyReply
) {
  const body = request.body;
  if (body.action === 'run' && body.ruleId) {
    const result = automationService.triggerRule(body.ruleId);
    return reply.send(result);
  }

  const newRule = automationService.createRule(body);
  return reply.status(201).send(newRule);
}
