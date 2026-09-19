import { randomUUID } from 'crypto';
import { Issue, Project, Sprint, Comment, DecisionRecord, IssuesQueryParams, IssueStatus, IssuePriority, IssueType } from '@flowline/types';
import { pool } from '../../db/client.js';
import { CreateIssueDto, UpdateIssueDto, CreateProjectDto, CreateSprintDto } from './core.types.js';

export class CoreRepository {
  public async queryIssues(params: IssuesQueryParams): Promise<{ data: Issue[]; nextCursor: string | null }> {
    const limit = params.limit ? Number(params.limit) : 50;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.projectId) {
      conditions.push(`(i.project_id::text = $${idx} OR LOWER(p_proj.key) = LOWER($${idx}))`);
      values.push(params.projectId);
      idx++;
    }

    if (params.status) {
      conditions.push(`s.name = $${idx}`);
      values.push(params.status);
      idx++;
    }

    if (params.sprintId) {
      conditions.push(`i.sprint_id::text = $${idx}`);
      values.push(params.sprintId);
      idx++;
    }

    if (params.assigneeId) {
      conditions.push(`i.assignee_id::text = $${idx}`);
      values.push(params.assigneeId);
      idx++;
    }

    if (params.priority) {
      conditions.push(`p.name = $${idx}`);
      values.push(params.priority);
      idx++;
    }

    if (params.type) {
      conditions.push(`t.name = $${idx}`);
      values.push(params.type);
      idx++;
    }

    if (params.search) {
      conditions.push(`(i.summary ILIKE $${idx} OR i.description ILIKE $${idx} OR i.key ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }

    if (params.cursor) {
      conditions.push(`i.created_at < $${idx}`);
      values.push(params.cursor);
      idx++;
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
      LEFT JOIN projects p_proj ON i.project_id = p_proj.id
      LEFT JOIN issue_statuses s ON i.status_id = s.id
      LEFT JOIN priorities p ON i.priority_id = p.id
      LEFT JOIN issue_types t ON i.issue_type_id = t.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${idx};
    `;

    values.push(limit + 1);
    const res = await pool.query(sql, values);
    const rows = res.rows;
    const hasMore = rows.length > limit;
    const data = (hasMore ? rows.slice(0, limit) : rows).map(this.mapIssueRow);
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].createdAt : null;

    return {
      data,
      nextCursor
    };
  }

  public async getIssueByIdOrKey(idOrKey: string): Promise<Issue | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrKey);
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
      WHERE ${isUuid ? 'i.id::text = $1 OR LOWER(i.key) = LOWER($1)' : 'LOWER(i.key) = LOWER($1)'}
      LIMIT 1;
    `;

    const res = await pool.query(sql, [idOrKey]);
    if (!res.rows[0]) return null;
    return this.mapIssueRow(res.rows[0]);
  }

  public async createIssue(
    tenantId: string,
    data: CreateIssueDto & { reporterId: string }
  ): Promise<Issue> {
    // Resolve project, taxonomy, status, and priority IDs
    const projectRes = await pool.query(
      'SELECT id, tenant_id FROM projects WHERE id::text = $1 OR LOWER(key) = LOWER($1) LIMIT 1;',
      [data.projectId]
    );
    const projectId = projectRes.rows[0]?.id || data.projectId;
    const resolvedTenantId = projectRes.rows[0]?.tenant_id || tenantId;

    const typeRes = await pool.query(
      'SELECT id FROM issue_types WHERE name = $1 LIMIT 1;',
      [data.type || 'task']
    );
    const issueTypeId = typeRes.rows[0]?.id || '30000000-0000-0000-0000-000000000003';

    const statusRes = await pool.query(
      'SELECT id FROM issue_statuses WHERE name = $1 LIMIT 1;',
      [data.status || 'todo']
    );
    const statusId = statusRes.rows[0]?.id || '40000000-0000-0000-0000-000000000002';

    const priorityRes = await pool.query(
      'SELECT id FROM priorities WHERE name = $1 LIMIT 1;',
      [data.priority || 'medium']
    );
    const priorityId = priorityRes.rows[0]?.id || '50000000-0000-0000-0000-000000000003';

    const insertSql = `
      INSERT INTO issues (
        tenant_id,
        project_id,
        issue_type_id,
        status_id,
        priority_id,
        summary,
        description,
        reporter_id,
        assignee_id,
        sprint_id,
        story_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, key;
    `;

    const insertRes = await pool.query(insertSql, [
      resolvedTenantId,
      projectId,
      issueTypeId,
      statusId,
      priorityId,
      data.title,
      data.description || '',
      data.reporterId,
      data.assigneeId || null,
      data.sprintId || null,
      data.storyPoints || null
    ]);

    const created = await this.getIssueByIdOrKey(insertRes.rows[0].id);
    return created!;
  }

  public async updateIssue(id: string, updates: UpdateIssueDto): Promise<Issue | null> {
    const existing = await this.getIssueByIdOrKey(id);
    if (!existing) return null;

    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [existing.id];
    let idx = 2;

    if (updates.title !== undefined) {
      setClauses.push(`summary = $${idx}`);
      values.push(updates.title);
      idx++;
    }

    if (updates.description !== undefined) {
      setClauses.push(`description = $${idx}`);
      values.push(updates.description);
      idx++;
    }

    if (updates.assigneeId !== undefined) {
      setClauses.push(`assignee_id = $${idx}`);
      values.push(updates.assigneeId);
      idx++;
    }

    if (updates.sprintId !== undefined) {
      setClauses.push(`sprint_id = $${idx}`);
      values.push(updates.sprintId);
      idx++;
    }

    if (updates.storyPoints !== undefined) {
      setClauses.push(`story_points = $${idx}`);
      values.push(updates.storyPoints);
      idx++;
    }

    if (updates.status !== undefined) {
      const statusRes = await pool.query('SELECT id FROM issue_statuses WHERE name = $1 LIMIT 1;', [updates.status]);
      if (statusRes.rows[0]) {
        setClauses.push(`status_id = $${idx}`);
        values.push(statusRes.rows[0].id);
        idx++;
      }
    }

    if (updates.priority !== undefined) {
      const prioRes = await pool.query('SELECT id FROM priorities WHERE name = $1 LIMIT 1;', [updates.priority]);
      if (prioRes.rows[0]) {
        setClauses.push(`priority_id = $${idx}`);
        values.push(prioRes.rows[0].id);
        idx++;
      }
    }

    const updateSql = `
      UPDATE issues
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id;
    `;

    await pool.query(updateSql, values);
    return this.getIssueByIdOrKey(existing.id);
  }

  public async createProject(
    tenantId: string,
    leadId: string,
    data: CreateProjectDto
  ): Promise<Project> {
    const id = randomUUID();
    const cleanKey = data.key.toUpperCase().trim();
    const cleanName = data.name.trim();
    const cleanDesc = data.description?.trim() || '';
    const color = data.color || '#3B82F6';

    let resolvedTenantId = tenantId;
    const isTenantUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId || '');
    if (!isTenantUuid) {
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE slug = $1 LIMIT 1;', [tenantId]);
      resolvedTenantId = tenantRes.rows[0]?.id;
      if (!resolvedTenantId) {
        const firstTenant = await pool.query('SELECT id FROM tenants LIMIT 1;');
        resolvedTenantId = firstTenant.rows[0]?.id || '00000000-0000-0000-0000-000000000001';
      }
    }

    let resolvedLeadId = leadId;
    const isLeadUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId || '');
    if (!isLeadUuid && leadId) {
      const userRes = await pool.query('SELECT id FROM users LIMIT 1;');
      resolvedLeadId = userRes.rows[0]?.id || null;
    }

    const insertProjectSql = `
      INSERT INTO projects (id, tenant_id, key, name, description, lead_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, key, name, description, lead_id as "leadId", created_at as "createdAt";
    `;

    const res = await pool.query(insertProjectSql, [
      id,
      resolvedTenantId,
      cleanKey,
      cleanName,
      cleanDesc,
      resolvedLeadId || null
    ]);

    if (resolvedLeadId) {
      await pool.query(
        `INSERT INTO project_members (id, tenant_id, project_id, user_id, role)
         VALUES ($1, $2, $3, $4, 'lead')
         ON CONFLICT (project_id, user_id) DO NOTHING;`,
        [randomUUID(), resolvedTenantId, id, resolvedLeadId]
      );
    }

    await pool.query(
      `INSERT INTO sprints (id, tenant_id, project_id, name, goal, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days');`,
      [randomUUID(), resolvedTenantId, id, 'Sprint 1', `${cleanName} Initial Sprint`]
    );

    return {
      id: res.rows[0].id,
      key: res.rows[0].key,
      name: res.rows[0].name,
      description: res.rows[0].description,
      leadId: res.rows[0].leadId || '',
      memberCount: 1,
      color,
      createdAt: res.rows[0].createdAt
    };
  }

  public async getProjectByIdOrKey(idOrKey: string, tenantId?: string): Promise<Project | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrKey);
    const sql = `
      SELECT 
        p.id,
        p.key,
        p.name,
        COALESCE(p.description, '') as "description",
        COALESCE(p.lead_id::text, '') as "leadId",
        COUNT(pm.id)::int as "memberCount",
        '#3B82F6' as "color",
        p.created_at as "createdAt"
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (${isUuid ? 'p.id::text = $1 OR LOWER(p.key) = LOWER($1)' : 'LOWER(p.key) = LOWER($1)'})
        ${tenantId ? 'AND p.tenant_id::text = $2' : ''}
      GROUP BY p.id
      LIMIT 1;
    `;

    const res = await pool.query(sql, tenantId ? [idOrKey, tenantId] : [idOrKey]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      leadId: r.leadId || '',
      memberCount: r.memberCount || 1,
      color: r.color,
      createdAt: r.createdAt
    };
  }

  public async getProjects(tenantId?: string): Promise<Project[]> {
    const sql = `
      SELECT 
        p.id,
        p.key,
        p.name,
        COALESCE(p.description, '') as "description",
        COALESCE(p.lead_id::text, '') as "leadId",
        COUNT(pm.id)::int as "memberCount",
        '#3B82F6' as "color",
        p.created_at as "createdAt"
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      ${tenantId ? 'WHERE p.tenant_id::text = $1' : ''}
      GROUP BY p.id
      ORDER BY p.name ASC;
    `;

    const res = await pool.query(sql, tenantId ? [tenantId] : []);
    return res.rows.map(r => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      leadId: r.leadId || '',
      memberCount: r.memberCount || 1,
      color: r.color,
      createdAt: r.createdAt
    }));
  }

  public async createSprint(
    tenantId: string,
    data: CreateSprintDto
  ): Promise<Sprint> {
    const projectRes = await pool.query(
      'SELECT id, tenant_id FROM projects WHERE id::text = $1 OR LOWER(key) = LOWER($1) LIMIT 1;',
      [data.projectId]
    );
    const projectId = projectRes.rows[0]?.id || data.projectId;
    const resolvedTenantId = projectRes.rows[0]?.tenant_id || tenantId;

    const id = randomUUID();
    const insertSql = `
      INSERT INTO sprints (id, tenant_id, project_id, name, goal, status, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, 'active', COALESCE($6::date, CURRENT_DATE), COALESCE($7::date, CURRENT_DATE + INTERVAL '14 days'))
      RETURNING id, project_id as "projectId", name, COALESCE(goal, '') as "goal", 
                start_date as "startDate", end_date as "endDate", status, created_at as "createdAt";
    `;

    const res = await pool.query(insertSql, [
      id,
      resolvedTenantId,
      projectId,
      data.name,
      data.goal || '',
      data.startDate || null,
      data.endDate || null
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      goal: r.goal,
      startDate: r.startDate || new Date().toISOString(),
      endDate: r.endDate || new Date().toISOString(),
      status: r.status || 'active'
    };
  }

  public async getSprints(projectId?: string): Promise<Sprint[]> {
    const sql = `
      SELECT 
        s.id,
        s.project_id as "projectId",
        s.name,
        COALESCE(s.goal, '') as "goal",
        s.start_date as "startDate",
        s.end_date as "endDate",
        s.status,
        s.created_at as "createdAt"
      FROM sprints s
      JOIN projects p ON s.project_id = p.id
      ${projectId ? 'WHERE s.project_id::text = $1 OR LOWER(p.key) = LOWER($1)' : ''}
      ORDER BY s.start_date ASC;
    `;

    const res = await pool.query(sql, projectId ? [projectId] : []);
    return res.rows.map(r => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      goal: r.goal,
      startDate: r.startDate || new Date().toISOString(),
      endDate: r.endDate || new Date().toISOString(),
      status: r.status || 'future'
    }));
  }

  public async getComments(issueIdOrKey: string): Promise<Comment[]> {
    const issue = await this.getIssueByIdOrKey(issueIdOrKey);
    const resolvedId = issue ? issue.id : issueIdOrKey;

    const sql = `
      SELECT 
        c.id,
        c.issue_id as "issueId",
        c.author_id as "authorId",
        c.body,
        c.created_at as "createdAt",
        c.updated_at as "updatedAt"
      FROM comments c
      WHERE c.issue_id::text = $1
      ORDER BY c.created_at ASC;
    `;

    const res = await pool.query(sql, [resolvedId]);
    return res.rows;
  }

  public async addComment(
    tenantId: string,
    issueIdOrKey: string,
    authorId: string,
    body: string
  ): Promise<Comment> {
    const issue = await this.getIssueByIdOrKey(issueIdOrKey);
    const resolvedIssueId = issue ? issue.id : issueIdOrKey;

    let resolvedTenantId = tenantId;
    const isTenantUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId || '');
    if (!isTenantUuid) {
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE slug = $1 LIMIT 1;', [tenantId]);
      resolvedTenantId = tenantRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';
    }

    let resolvedAuthorId = authorId;
    const isAuthorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorId || '');
    if (!isAuthorUuid) {
      const userRes = await pool.query('SELECT id FROM users LIMIT 1;');
      resolvedAuthorId = userRes.rows[0]?.id || '10000000-0000-0000-0000-000000000001';
    }

    const insertSql = `
      INSERT INTO comments (tenant_id, issue_id, author_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id, issue_id as "issueId", author_id as "authorId", body, created_at as "createdAt", updated_at as "updatedAt";
    `;

    const res = await pool.query(insertSql, [resolvedTenantId, resolvedIssueId, resolvedAuthorId, body]);
    return res.rows[0];
  }

  public async getDecisions(_projectId?: string): Promise<DecisionRecord[]> {
    // Returns real decisions stored in the database or empty list
    return [];
  }

  private mapIssueRow(r: any): Issue {
    return {
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
    };
  }
}

export const coreRepository = new CoreRepository();
