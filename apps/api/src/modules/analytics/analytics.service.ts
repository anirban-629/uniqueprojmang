import { OrgWeatherMapSummary } from '@flowline/types';
import { analyticsRepository, AnalyticsRepository } from './analytics.repository.js';
import { VelocityMetricsDto } from './analytics.types.js';

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository = analyticsRepository) {}

  public async getWeatherMap(): Promise<OrgWeatherMapSummary[]> {
    return this.repository.getWeatherMapSummaries();
  }

  public async getVelocityMetrics(): Promise<VelocityMetricsDto> {
    return this.repository.getVelocityMetrics();
  }
}

export const analyticsService = new AnalyticsService();
