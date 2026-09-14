import { FastifySchema } from 'fastify';

export const weatherMapSchema: FastifySchema = {
  tags: ['Analytics'],
  summary: 'Get Org Weather Map Summary (Pre-Aggregated)',
  description: 'Pre-aggregated cross-team velocity, blocker count, and team health scores.'
};

export const legacyWeatherMapSchema: FastifySchema = {
  tags: ['Analytics'],
  summary: 'Get Org Weather Map Summary (Legacy Alias)'
};

export const velocitySchema: FastifySchema = {
  tags: ['Analytics'],
  summary: 'Get Team Velocity Metrics'
};
