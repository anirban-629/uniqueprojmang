import { FastifyPluginAsync } from 'fastify';
import * as controller from './automation.controller.js';
import * as schemas from './automation.schema.js';
import { registerAutomationEventListeners } from './automation.events.js';
import {
  ListAutomationRulesRoute,
  CreateOrTriggerAutomationRuleRoute
} from './automation.types.js';

export const automationRoutes: FastifyPluginAsync = async (fastify) => {
  // Register in-process event subscriptions once
  registerAutomationEventListeners();

  fastify.get<ListAutomationRulesRoute>('/api/automation', { schema: schemas.listAutomationRulesSchema }, controller.listRules);
  fastify.post<CreateOrTriggerAutomationRuleRoute>('/api/automation', { schema: schemas.createOrTriggerRuleSchema }, controller.createOrTriggerRule);
};
