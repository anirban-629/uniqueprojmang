import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@flowline/mock-db';
import { IssuesQueryParams } from '@flowline/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const projectId = searchParams.get('projectId') || 'proj-flow';
  const status = (searchParams.get('status') as any) || undefined;
  const sprintId = searchParams.get('sprintId') ?? undefined;
  const assigneeId = searchParams.get('assigneeId') || undefined;
  const priority = (searchParams.get('priority') as any) || undefined;
  const type = (searchParams.get('type') as any) || undefined;
  const search = searchParams.get('search') || undefined;
  const cursor = searchParams.get('cursor') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

  try {
    const latency = await mockDb.simulateNetwork({
      chaos: searchParams.get('chaos') === 'true'
    });

    const result = mockDb.queryIssues({
      projectId,
      status,
      sprintId,
      assigneeId,
      priority,
      type,
      search,
      cursor,
      limit
    });

    result.meta.latencyMs = latency;

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'x-flowline-latency-ms': String(latency)
      }
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const latency = await mockDb.simulateNetwork();

    if (!body.title || !body.projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: title and projectId' },
        { status: 400 }
      );
    }

    const created = mockDb.createIssue(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create issue' },
      { status: 500 }
    );
  }
}
