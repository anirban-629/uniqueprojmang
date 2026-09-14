-- ============================================================================
-- MODULE 05: TICKETS (ISSUES) & BUSINESS RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS issues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    key             TEXT NOT NULL,                        -- e.g. "ENG-123", generated via trigger
    sequence_num    INTEGER NOT NULL,                      -- per-project incrementing sequence

    issue_type_id   UUID NOT NULL REFERENCES issue_types(id),
    status_id       UUID NOT NULL REFERENCES issue_statuses(id),
    priority_id     UUID REFERENCES priorities(id),

    summary         TEXT NOT NULL,
    description     TEXT,
    description_search TSVECTOR,                            -- populated via trigger for full-text search

    parent_id       UUID REFERENCES issues(id) ON DELETE CASCADE,  -- for subtasks / epic children
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

-- 1. Auto-generate human-readable issue key (PROJECTKEY-N) on insert
CREATE OR REPLACE FUNCTION generate_issue_key()
RETURNS TRIGGER AS $$
DECLARE
    proj_key TEXT;
    next_seq INTEGER;
BEGIN
    SELECT key INTO proj_key FROM projects WHERE id = NEW.project_id;

    SELECT COALESCE(MAX(sequence_num), 0) + 1 INTO next_seq
    FROM issues WHERE project_id = NEW.project_id;

    NEW.sequence_num := next_seq;
    NEW.key := proj_key || '-' || next_seq;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_issue_key ON issues;
CREATE TRIGGER trg_generate_issue_key
    BEFORE INSERT ON issues
    FOR EACH ROW EXECUTE FUNCTION generate_issue_key();

-- 2. Keep description_search in sync for weighted full-text search (Summary = A, Description = B)
CREATE OR REPLACE FUNCTION sync_issue_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.description_search :=
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_issue_search ON issues;
CREATE TRIGGER trg_sync_issue_search
    BEFORE INSERT OR UPDATE OF summary, description ON issues
    FOR EACH ROW EXECUTE FUNCTION sync_issue_search_vector();

-- 3. Enforce sensible parent/child nesting based on issue_types.hierarchy_level.
-- Rule: a child's hierarchy_level must be strictly lower than its parent's.
CREATE OR REPLACE FUNCTION validate_issue_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    child_level  SMALLINT;
    parent_level SMALLINT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT hierarchy_level INTO child_level FROM issue_types WHERE id = NEW.issue_type_id;
    SELECT it.hierarchy_level INTO parent_level
        FROM issues i JOIN issue_types it ON it.id = i.issue_type_id
        WHERE i.id = NEW.parent_id;

    IF parent_level IS NULL THEN
        RAISE EXCEPTION 'Parent issue % not found', NEW.parent_id;
    END IF;

    IF child_level >= parent_level THEN
        RAISE EXCEPTION
            'Invalid hierarchy: a level-% item cannot be a child of a level-% item (child must be strictly lower)',
            child_level, parent_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_issue_hierarchy ON issues;
CREATE TRIGGER trg_validate_issue_hierarchy
    BEFORE INSERT OR UPDATE OF parent_id, issue_type_id ON issues
    FOR EACH ROW EXECUTE FUNCTION validate_issue_hierarchy();

DROP TRIGGER IF EXISTS trg_issues_updated_at ON issues;
CREATE TRIGGER trg_issues_updated_at 
    BEFORE UPDATE ON issues 
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS & Tenant Isolation Policies
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues FORCE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_issues' AND tablename = 'issues') THEN
        CREATE POLICY tenant_isolation_issues ON issues
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
END $$;
