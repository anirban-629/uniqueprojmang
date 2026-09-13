import { NextResponse } from 'next/server';
import { mockDb } from '@flowline/mock-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  await mockDb.simulateNetwork();
  const summaries = mockDb.getWeatherMapSummaries();
  return NextResponse.json(summaries);
}
