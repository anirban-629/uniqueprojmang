import { OrgWeatherMapSummary } from '@flowline/types';

export interface VelocityMetricsDto {
  averageVelocity: number;
  trend: 'up' | 'down' | 'stable';
  completedPointsLast3Sprints: number[];
  predictedCompletionDate: string;
}

export interface GetWeatherMapRoute {}
export interface GetVelocityRoute {}
