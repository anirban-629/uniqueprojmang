import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@flowline/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId') || undefined;
  const sprints = mockDb.getSprints(projectId);
  return NextResponse.json(sprints);
}
