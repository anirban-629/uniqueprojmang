-- ==============================================================================
-- 01b_rbac_roles_and_permissions.sql: Data-Driven Roles & Permissions (RBAC)
-- ==============================================================================

-- 1. Master List of all Permission Flags
CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,                -- e.g. 'issue.edit.any', 'project.archive'
    description TEXT NOT NULL,
    scope       TEXT NOT NULL CHECK (scope IN ('tenant', 'project')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope);

-- 2. Tenant-Level Roles (tenant_id IS NULL = system default role)
CREATE TABLE IF NOT EXISTS tenant_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system default
    name        TEXT NOT NULL,                        -- 'owner' | 'admin' | 'member' | 'billing_manager' | 'guest'
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,       -- true = protected built-in role
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- 3. Project-Level Roles (tenant_id IS NULL = system default role)
CREATE TABLE IF NOT EXISTS project_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system default
    name        TEXT NOT NULL,                        -- 'lead' | 'contributor' | 'reporter' | 'viewer' | 'guest'
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,       -- true = protected built-in role
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- 4. Tenant Role Permissions Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS tenant_role_permissions (
    tenant_role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
    permission_id  UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (tenant_role_id, permission_id)
);

-- 5. Project Role Permissions Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS project_role_permissions (
    project_role_id UUID NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (project_role_id, permission_id)
);

-- 6. Add Foreign Keys to Memberships (if columns don't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_members' AND column_name = 'tenant_role_id'
    ) THEN
        ALTER TABLE tenant_members ADD COLUMN tenant_role_id UUID REFERENCES tenant_roles(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_members' AND column_name = 'project_role_id'
    ) THEN
        ALTER TABLE project_members ADD COLUMN project_role_id UUID REFERENCES project_roles(id);
    END IF;
END $$;

-- ==============================================================================
-- INITIAL SEED: System Permissions & Default Roles
-- ==============================================================================

-- 1. Insert Master Permissions
INSERT INTO permissions (key, description, scope) VALUES
    -- Tenant Level Permissions
    ('tenant.view', 'View workspace metadata and plan', 'tenant'),
    ('tenant.update', 'Update workspace name, domain, and settings', 'tenant'),
    ('tenant.delete', 'Delete or archive entire workspace', 'tenant'),
    ('members.view', 'View workspace member list and roles', 'tenant'),
    ('members.manage', 'Invite members and modify member roles', 'tenant'),
    ('members.remove', 'Remove members from workspace', 'tenant'),
    ('billing.manage', 'Manage subscription, invoices, and billing tier', 'tenant'),
    ('projects.create', 'Create new projects within the workspace', 'tenant'),
    ('invitations.create', 'Issue workspace invitations', 'tenant'),
    
    -- Project Level Permissions
    ('project.view', 'View project dashboard, issues, and board', 'project'),
    ('project.update', 'Update project metadata, workflows, and settings', 'project'),
    ('project.archive', 'Archive or unarchive project', 'project'),
    ('project.delete', 'Permanently delete project and its tickets', 'project'),
    ('project.manage_members', 'Add, change, or remove project members and roles', 'project'),
    ('issue.create', 'Create new issues in project', 'project'),
    ('issue.view', 'View issue details and comments', 'project'),
    ('issue.edit.own', 'Edit issues created by the user', 'project'),
    ('issue.edit.any', 'Edit any issue regardless of author', 'project'),
    ('issue.delete.own', 'Delete issues created by the user', 'project'),
    ('issue.delete.any', 'Delete any issue regardless of author', 'project'),
    ('comment.create', 'Post comments on issues', 'project'),
    ('comment.delete.own', 'Delete own comments', 'project'),
    ('comment.delete.any', 'Delete any comment regardless of author', 'project')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- 2. Insert Built-in System Tenant Roles (tenant_id IS NULL)
INSERT INTO tenant_roles (tenant_id, name, description, is_system) VALUES
    (NULL, 'owner', 'Full workspace ownership and administrative authority', TRUE),
    (NULL, 'admin', 'Workspace administration, member and project management', TRUE),
    (NULL, 'member', 'Standard workspace collaborator', TRUE),
    (NULL, 'billing_manager', 'Manages billing, invoices, and subscription plans', TRUE),
    (NULL, 'guest', 'Restricted access guest user', TRUE)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 3. Insert Built-in System Project Roles (tenant_id IS NULL)
INSERT INTO project_roles (tenant_id, name, description, is_system) VALUES
    (NULL, 'lead', 'Project leader with full project administration capabilities', TRUE),
    (NULL, 'contributor', 'Full issue creation, editing, and triage capabilities', TRUE),
    (NULL, 'reporter', 'Can create and comment on issues, but not reassign or triage', TRUE),
    (NULL, 'viewer', 'Read-only access to project issues and boards', TRUE),
    (NULL, 'guest', 'Minimal read-only access', TRUE)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 4. Map Permissions to Tenant Roles
DO $$
DECLARE
    role_owner_id UUID;
    role_admin_id UUID;
    role_member_id UUID;
    role_billing_id UUID;
    role_guest_id UUID;
BEGIN
    SELECT id INTO role_owner_id FROM tenant_roles WHERE tenant_id IS NULL AND name = 'owner';
    SELECT id INTO role_admin_id FROM tenant_roles WHERE tenant_id IS NULL AND name = 'admin';
    SELECT id INTO role_member_id FROM tenant_roles WHERE tenant_id IS NULL AND name = 'member';
    SELECT id INTO role_billing_id FROM tenant_roles WHERE tenant_id IS NULL AND name = 'billing_manager';
    SELECT id INTO role_guest_id FROM tenant_roles WHERE tenant_id IS NULL AND name = 'guest';

    -- Owner has all tenant permissions
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT role_owner_id, id FROM permissions WHERE scope = 'tenant'
    ON CONFLICT DO NOTHING;

    -- Admin has all tenant permissions except tenant.delete
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT role_admin_id, id FROM permissions WHERE scope = 'tenant' AND key != 'tenant.delete'
    ON CONFLICT DO NOTHING;

    -- Member has tenant.view, members.view, projects.create
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT role_member_id, id FROM permissions WHERE key IN ('tenant.view', 'members.view', 'projects.create')
    ON CONFLICT DO NOTHING;

    -- Billing Manager has tenant.view, billing.manage
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT role_billing_id, id FROM permissions WHERE key IN ('tenant.view', 'billing.manage')
    ON CONFLICT DO NOTHING;

    -- Guest has tenant.view
    INSERT INTO tenant_role_permissions (tenant_role_id, permission_id)
    SELECT role_guest_id, id FROM permissions WHERE key = 'tenant.view'
    ON CONFLICT DO NOTHING;
END $$;

-- 5. Map Permissions to Project Roles
DO $$
DECLARE
    role_lead_id UUID;
    role_contrib_id UUID;
    role_reporter_id UUID;
    role_viewer_id UUID;
    role_guest_id UUID;
BEGIN
    SELECT id INTO role_lead_id FROM project_roles WHERE tenant_id IS NULL AND name = 'lead';
    SELECT id INTO role_contrib_id FROM project_roles WHERE tenant_id IS NULL AND name = 'contributor';
    SELECT id INTO role_reporter_id FROM project_roles WHERE tenant_id IS NULL AND name = 'reporter';
    SELECT id INTO role_viewer_id FROM project_roles WHERE tenant_id IS NULL AND name = 'viewer';
    SELECT id INTO role_guest_id FROM project_roles WHERE tenant_id IS NULL AND name = 'guest';

    -- Lead has all project permissions
    INSERT INTO project_role_permissions (project_role_id, permission_id)
    SELECT role_lead_id, id FROM permissions WHERE scope = 'project'
    ON CONFLICT DO NOTHING;

    -- Contributor has view, update, issues (own & any), comments (own)
    INSERT INTO project_role_permissions (project_role_id, permission_id)
    SELECT role_contrib_id, id FROM permissions 
    WHERE key IN ('project.view', 'issue.create', 'issue.view', 'issue.edit.own', 'issue.edit.any', 'issue.delete.own', 'comment.create', 'comment.delete.own')
    ON CONFLICT DO NOTHING;

    -- Reporter has view, issue.create, issue.view, issue.edit.own, comment.create
    INSERT INTO project_role_permissions (project_role_id, permission_id)
    SELECT role_reporter_id, id FROM permissions 
    WHERE key IN ('project.view', 'issue.create', 'issue.view', 'issue.edit.own', 'comment.create')
    ON CONFLICT DO NOTHING;

    -- Viewer has read-only access
    INSERT INTO project_role_permissions (project_role_id, permission_id)
    SELECT role_viewer_id, id FROM permissions 
    WHERE key IN ('project.view', 'issue.view')
    ON CONFLICT DO NOTHING;

    -- Guest has project.view
    INSERT INTO project_role_permissions (project_role_id, permission_id)
    SELECT role_guest_id, id FROM permissions 
    WHERE key = 'project.view'
    ON CONFLICT DO NOTHING;
END $$;
