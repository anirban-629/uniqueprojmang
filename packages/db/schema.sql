-- ==============================================================================
-- FLOWLINE — MULTI-TENANT POSTGRESQL 16 SCHEMA (SUPABASE / NEON COMPATIBLE)
-- ==============================================================================
-- Model: Shared Schema + Row Level Security (RLS)
-- Isolation: Strict multi-tenancy enforced at database engine level via RLS
-- Optimization: JSONB custom fields with GIN indexing, Lexorank, Soft deletes
-- Cost: 100% Free-Tier compatible ($0/month on Supabase / Neon)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create helper schema for session management
CREATE SCHEMA IF NOT EXISTS app;

-- Helper function to retrieve the active tenant company_id for the current session/transaction
CREATE OR REPLACE FUNCTION app.current_company_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_company_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper procedure to set the current tenant company_id in the current transaction
CREATE OR REPLACE FUNCTION app.set_current_company(tenant_id UUID) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_company_id', tenant_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. CORE TENANCY & IDENTITY TABLES
-- ==============================================================================

-- Companies (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(32) NOT NULL DEFAULT 'free',
    settings JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Global identities across tenants or Supabase Auth mapped)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company Memberships (Tenant-User association with roles)
CREATE TABLE IF NOT EXISTS company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'engineer', -- 'admin', 'tech_lead', 'engineer', 'product_manager', 'designer'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_company ON company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON company_memberships(user_id);

-- ==============================================================================
-- 4. SPACES (PROJECTS), SPRINTS & WORKFLOWS
-- ==============================================================================

-- Spaces / Projects (Tenant Scoped)
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key VARCHAR(16) NOT NULL, -- e.g. "FLOW", "CORE"
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    lead_id UUID REFERENCES users(id) ON DELETE SET NULL,
    icon VARCHAR(64) DEFAULT 'Folder',
    color VARCHAR(32) DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, key)
);

CREATE INDEX IF NOT EXISTS idx_spaces_company ON spaces(company_id) WHERE deleted_at IS NULL;

-- Sprints (Tenant & Space Scoped)
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT DEFAULT '',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'future', -- 'future', 'active', 'closed'
    total_points NUMERIC(6,1) DEFAULT 0,
    completed_points NUMERIC(6,1) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprints_company_space ON sprints(company_id, space_id);

-- Workflow Statuses (Tenant Scoped custom workflow stages)
CREATE TABLE IF NOT EXISTS workflow_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE, -- NULL = default across all company spaces
    key VARCHAR(64) NOT NULL, -- 'backlog', 'todo', 'in_progress', 'in_review', 'done'
    label VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'to_do', 'in_progress', 'done'
    position INT NOT NULL DEFAULT 0,
    color VARCHAR(32) DEFAULT '#94a3b8',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, space_id, key)
);

-- Custom Field Definitions (Dynamic Jira-style fields per tenant)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    field_key VARCHAR(64) NOT NULL,
    field_type VARCHAR(32) NOT NULL, -- 'string', 'number', 'select', 'multiselect', 'date', 'boolean'
    options JSONB DEFAULT '[]'::JSONB,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, space_id, field_key)
);

-- ==============================================================================
-- 5. ISSUES & ACTIVITIES (CORE DOMAIN)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    issue_number INT NOT NULL,
    key VARCHAR(32) NOT NULL, -- e.g. "FLOW-1042"
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(64) NOT NULL DEFAULT 'todo',
    priority VARCHAR(32) NOT NULL DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    type VARCHAR(32) NOT NULL DEFAULT 'task', -- 'story', 'bug', 'task', 'epic'
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES users(id),
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    story_points NUMERIC(5,1),
    rank VARCHAR(128) NOT NULL DEFAULT '0|hzzzzz:', -- Monotonic Lexorank string for zero-cost drag and drop
    labels TEXT[] DEFAULT ARRAY[]::TEXT[],
    blocker_ids UUID[] DEFAULT ARRAY[]::UUID[],
    blocked_by_ids UUID[] DEFAULT ARRAY[]::UUID[],
    custom_fields JSONB NOT NULL DEFAULT '{}'::JSONB, -- Scalable custom fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete support
    UNIQUE(company_id, key)
);

-- High Performance Indexes for 100k+ Issues at Scale
CREATE INDEX IF NOT EXISTS idx_issues_company_space ON issues(company_id, space_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_company_status ON issues(company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_company_sprint ON issues(company_id, sprint_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_rank ON issues(company_id, space_id, rank) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_custom_fields_gin ON issues USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_issues_title_search ON issues USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Comments on Issues (Tenant Scoped)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(company_id, issue_id) WHERE deleted_at IS NULL;

-- Activity Logs & Decision Records
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(64) NOT NULL, -- 'status_change', 'comment', 'assignment', 'priority_change', 'created'
    old_value TEXT,
    new_value TEXT,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_issue ON activities(company_id, issue_id, created_at DESC);

-- Automation Rules (Tenant Scoped)
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    trigger_event VARCHAR(64) NOT NULL, -- 'STATUS_CHANGED', 'ISSUE_CREATED', 'BLOCKER_ADDED'
    condition_expression TEXT DEFAULT '',
    action_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    execution_count INT NOT NULL DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable Audit Log for Compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    diff JSONB DEFAULT '{}'::JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_time ON audit_logs(company_id, created_at DESC);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES — ENFORCED ON EVERY TENANT TABLE
-- ==============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Multi-Tenant Restrictive Policies using app.current_company_id()
-- Note: 'RESTRICTIVE' ensures no tenant policy can accidentally be bypassed by another permissive policy.

CREATE POLICY tenant_isolation_memberships ON company_memberships
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_spaces ON spaces
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_sprints ON sprints
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_workflow ON workflow_statuses
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_custom_fields ON custom_field_definitions
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_issues ON issues
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_comments ON comments
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_activities ON activities
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_automation ON automation_rules
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    AS RESTRICTIVE
    USING (company_id = app.current_company_id())
    WITH CHECK (company_id = app.current_company_id());

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
