import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@flowline/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const idOrKey = request.nextUrl.searchParams.get('id');
  if (idOrKey) {
    const proj = mockDb.getProject(idOrKey);
    if (!proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json(proj);
  }

  const projects = mockDb.getProjects();
  return NextResponse.json(projects);
}
