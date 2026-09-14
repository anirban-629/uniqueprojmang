-- ============================================================================
-- MODULE 01: AUTH, USERS & TENANCY
-- ============================================================================

-- 1. Tenants (Organizations / Workspaces)
CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,              -- e.g. "acme-corp", used in URLs
    plan            TEXT NOT NULL DEFAULT 'free',       -- free | pro | enterprise
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Users (App profile matching auth.users)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT,                               -- Argon2id/bcrypt hashed password with server pepper
    full_name       TEXT,
    avatar_url      TEXT,
    status          TEXT NOT NULL DEFAULT 'active',     -- active | suspended | pending_verification
    email_verified_at TIMESTAMPTZ,
    mfa_secret      TEXT,                               -- Encrypted TOTP secret
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Tenant Members (User-Tenant Association & Roles)
CREATE TABLE IF NOT EXISTS tenant_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member',      -- owner | admin | member | viewer
    status          TEXT NOT NULL DEFAULT 'active',       -- active | invited | suspended
    invited_at      TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);

-- 4. Refresh Tokens & Session Families (Theft detection)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,                -- SHA-256 hash of refresh token
    family_id       UUID NOT NULL,                      -- Session family ID for rotation reuse detection
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 5. Tenant Invitations (Single-use expiring tokens)
CREATE TABLE IF NOT EXISTS invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member',      -- owner | admin | member | viewer
    token_hash      TEXT NOT NULL UNIQUE,                -- SHA-256 hash of invite secret
    invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- 6. Auth Audit Log (Compliance & Security Event Tracking)
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,                       -- login, failed_login, logout, register, switch_tenant, invite_sent, invite_accepted, password_changed
    ip              TEXT,
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_tenant ON auth_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at DESC);

-- RLS & Tenant Isolation Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_members FORCE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log FORCE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_select_own' AND tablename = 'tenants') THEN
        CREATE POLICY tenant_select_own ON tenants
            FOR SELECT
            USING (id IN (
                SELECT tenant_id FROM tenant_members
                WHERE user_id = auth.uid()
            ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_tenant_members' AND tablename = 'tenant_members') THEN
        CREATE POLICY tenant_isolation_tenant_members ON tenant_members
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_refresh_tokens' AND tablename = 'refresh_tokens') THEN
        CREATE POLICY tenant_isolation_refresh_tokens ON refresh_tokens
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_invitations' AND tablename = 'invitations') THEN
        CREATE POLICY tenant_isolation_invitations ON invitations
            AS RESTRICTIVE
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_auth_audit_log' AND tablename = 'auth_audit_log') THEN
        CREATE POLICY tenant_isolation_auth_audit_log ON auth_audit_log
            AS RESTRICTIVE
            USING (tenant_id IS NULL OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
            WITH CHECK (tenant_id IS NULL OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    END IF;
END $$;
