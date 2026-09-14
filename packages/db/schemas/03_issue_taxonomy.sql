-- ============================================================================
-- MODULE 03: ISSUE TAXONOMY (TYPES, STATUSES, PRIORITIES)
-- ============================================================================

-- 1. Issue Types (Hierarchical schemes: Epic[2], Standard[1], Subtask[0])
CREATE TABLE IF NOT EXISTS issue_types (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id        UUID REFERENCES projects(id) ON DELETE CASCADE,  -- null = tenant-wide default
    name              TEXT NOT NULL,                       -- Bug, Task, Story, Epic, Subtask, or custom
    icon              TEXT,                                 -- icon identifier for UI
    color             TEXT,
    -- Hierarchy level:
    --   0 = Subtask tier  (can only be a child; cannot have children)
    --   1 = Standard tier (Task, Story, Bug — default level for standard work)
    --   2 = Epic tier     (can be a parent of level-1 items; cannot be a child)
    hierarchy_level   SMALLINT NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_issue_types_project ON issue_types(project_id);

-- 2. Issue Statuses (Workflow stages categorized into todo, in_progress, done)
CREATE TABLE IF NOT EXISTS issue_statuses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,  -- null = tenant-wide default
    name            TEXT NOT NULL,                       -- Backlog, To Do, In Progress, In Review, Done
    category        TEXT NOT NULL,                       -- 'todo' | 'in_progress' | 'done'
    position        INTEGER NOT NULL DEFAULT 0,          -- ordering within workflow
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_statuses_project ON issue_statuses(project_id);

-- 3. Priorities (Urgency levels with rank and color)
CREATE TABLE IF NOT EXISTS priorities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                       -- Highest, High, Medium, Low, Lowest
    rank            INTEGER NOT NULL,                     -- 1 = highest urgency
    color           TEXT,
    UNIQUE (tenant_id, name)
);

-- RLS & Tenant Isolation Policies
ALTER TABLE issue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_types FORCE ROW LEVEL SECURITY;
ALTER TABLE issue_statuses FORCE ROW LEVEL SECURITY;
ALTER TABLE priorities FORCE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_issue_types' AND tablename = 'issue_types') THEN
        CREATE POLICY tenant_isolation_issue_types ON issue_types
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_issue_statuses' AND tablename = 'issue_statuses') THEN
        CREATE POLICY tenant_isolation_issue_statuses ON issue_statuses
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_priorities' AND tablename = 'priorities') THEN
        CREATE POLICY tenant_isolation_priorities ON priorities
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
END $$;
