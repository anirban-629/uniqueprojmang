import { mockDb } from '@flowline/mock-db';
import { OrgWeatherMapSummary } from '@flowline/types';

export class AnalyticsRepository {
  public async simulateNetwork(): Promise<number> {
    return mockDb.simulateNetwork();
  }

  public getWeatherMapSummaries(): OrgWeatherMapSummary[] {
    return mockDb.getWeatherMapSummaries();
  }
}

export const analyticsRepository = new AnalyticsRepository();
