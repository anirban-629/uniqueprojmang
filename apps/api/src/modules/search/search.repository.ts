import { Issue, IssueStatus, IssuePriority, IssueType } from '@flowline/types';
import { pool } from '../../db/client.js';

export class SearchRepository {
  public async searchIssues(query: { projectId?: string; search: string; limit: number }): Promise<{ data: Issue[] }> {
    const limit = query.limit || 20;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (query.projectId) {
      conditions.push(`i.project_id::text = $${idx}`);
      values.push(query.projectId);
      idx++;
    }

    if (query.search) {
      conditions.push(`(
        i.summary ILIKE $${idx} OR 
        i.description ILIKE $${idx} OR 
        i.key ILIKE $${idx} OR
        i.description_search @@ plainto_tsquery('english', $${idx + 1})
      )`);
      values.push(`%${query.search}%`);
      values.push(query.search);
      idx += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        i.id,
        i.key,
        i.project_id as "projectId",
        i.summary as "title",
        COALESCE(i.description, '') as "description",
        COALESCE(s.name, 'todo') as "status",
        COALESCE(p.name, 'medium') as "priority",
        COALESCE(t.name, 'task') as "type",
        i.assignee_id as "assigneeId",
        i.reporter_id as "reporterId",
        i.sprint_id as "sprintId",
        i.story_points as "storyPoints",
        i.sequence_num::text as "rank",
        ARRAY[]::text[] as "labels",
        i.created_at as "createdAt",
        i.updated_at as "updatedAt"
      FROM issues i
      LEFT JOIN issue_statuses s ON i.status_id = s.id
      LEFT JOIN priorities p ON i.priority_id = p.id
      LEFT JOIN issue_types t ON i.issue_type_id = t.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${idx};
    `;

    values.push(limit);
    const res = await pool.query(sql, values);
    const data: Issue[] = res.rows.map(r => ({
      id: r.id,
      key: r.key,
      projectId: r.projectId,
      title: r.title,
      description: r.description,
      status: (r.status || 'todo') as IssueStatus,
      priority: (r.priority || 'medium') as IssuePriority,
      type: (r.type || 'task') as IssueType,
      assigneeId: r.assigneeId || undefined,
      reporterId: r.reporterId,
      sprintId: r.sprintId || undefined,
      storyPoints: r.storyPoints ? Number(r.storyPoints) : undefined,
      rank: r.rank || '1',
      labels: r.labels || [],
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
    }));

    return { data };
  }
}

export const searchRepository = new SearchRepository();
