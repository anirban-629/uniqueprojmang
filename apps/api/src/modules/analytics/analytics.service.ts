import { OrgWeatherMapSummary } from '@flowline/types';
import { analyticsRepository, AnalyticsRepository } from './analytics.repository.js';
import { VelocityMetricsDto } from './analytics.types.js';

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository = analyticsRepository) {}

  public async getWeatherMap(): Promise<OrgWeatherMapSummary[]> {
    await this.repository.simulateNetwork();
    return this.repository.getWeatherMapSummaries();
  }

  public async getVelocityMetrics(): Promise<VelocityMetricsDto> {
    await this.repository.simulateNetwork();
    return {
      averageVelocity: 38.5,
      trend: 'up',
      completedPointsLast3Sprints: [34, 40, 42],
      predictedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString()
    };
  }
}

export const analyticsService = new AnalyticsService();
