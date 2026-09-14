-- ============================================================================
-- CORE / TICKETS MODULE DATABASE SCHEMA
-- ============================================================================

-- Issues (Core Tickets Table)
CREATE TABLE IF NOT EXISTS issues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    key             TEXT NOT NULL,
    sequence_num    INTEGER NOT NULL,

    issue_type_id   UUID NOT NULL REFERENCES issue_types(id),
    status_id       UUID NOT NULL REFERENCES issue_statuses(id),
    priority_id     UUID REFERENCES priorities(id),

    summary         TEXT NOT NULL,
    description     TEXT,
    description_search TSVECTOR,

    parent_id       UUID REFERENCES issues(id) ON DELETE CASCADE,
    sprint_id       UUID REFERENCES sprints(id) ON DELETE SET NULL,

    assignee_id     UUID REFERENCES users(id),
    reporter_id     UUID NOT NULL REFERENCES users(id),

    story_points    NUMERIC(5,2),
    due_date        DATE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,

    UNIQUE (project_id, sequence_num)
);

CREATE INDEX IF NOT EXISTS idx_issues_tenant ON issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_sprint ON issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status_id);
CREATE INDEX IF NOT EXISTS idx_issues_parent ON issues(parent_id);
CREATE INDEX IF NOT EXISTS idx_issues_search ON issues USING gin(description_search);
CREATE INDEX IF NOT EXISTS idx_issues_summary_trgm ON issues USING gin(summary gin_trgm_ops);
