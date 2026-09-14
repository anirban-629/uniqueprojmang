import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // Pre-aggregated Weather Map Summary (Section 1.9 - Materialized view representation)
  const handleWeatherMap = async () => {
    await mockDb.simulateNetwork();
    return mockDb.getWeatherMapSummaries();
  };

  fastify.get('/api/analytics/weather-map', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get Org Weather Map Summary (Pre-Aggregated)',
      description: 'Pre-aggregated cross-team velocity, blocker count, and team health scores.'
    }
  }, handleWeatherMap);

  // Backward compatibility alias
  fastify.get('/api/org/weather-map', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get Org Weather Map Summary (Legacy Alias)'
    }
  }, handleWeatherMap);

  fastify.get('/api/analytics/velocity', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get Team Velocity Metrics'
    }
  }, async () => {
    await mockDb.simulateNetwork();
    return {
      averageVelocity: 38.5,
      trend: 'up',
      completedPointsLast3Sprints: [34, 40, 42],
      predictedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString()
    };
  });
};
