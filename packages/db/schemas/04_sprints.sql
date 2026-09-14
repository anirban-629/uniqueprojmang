-- ============================================================================
-- MODULE 04: SPRINTS & AGILE ITERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sprints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    goal            TEXT,
    status          TEXT NOT NULL DEFAULT 'planned',      -- planned | active | completed
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);

DROP TRIGGER IF EXISTS trg_sprints_updated_at ON sprints;
CREATE TRIGGER trg_sprints_updated_at 
    BEFORE UPDATE ON sprints 
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS & Tenant Isolation Policies
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints FORCE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_sprints' AND tablename = 'sprints') THEN
        CREATE POLICY tenant_isolation_sprints ON sprints
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
END $$;
