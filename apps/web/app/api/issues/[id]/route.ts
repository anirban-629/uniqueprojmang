import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@flowline/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await mockDb.simulateNetwork();

  const issue = mockDb.getIssue(id);
  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  const comments = mockDb.getComments(issue.id);
  return NextResponse.json({ ...issue, comments });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    await mockDb.simulateNetwork();

    const updated = mockDb.updateIssue(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update issue' },
      { status: error.status || 500 }
    );
  }
}
