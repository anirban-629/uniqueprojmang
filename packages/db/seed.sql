-- ==============================================================================
-- FLOWLINE — MULTI-TENANT SEED DATA (SAMPLE DATA FOR 100 COMPANIES & SPACES)
-- ==============================================================================

DO $$
DECLARE
    acme_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    linear_id UUID := 'a0000000-0000-0000-0000-000000000002'::UUID;
    user_alex UUID := 'u0000000-0000-0000-0000-000000000001'::UUID;
    user_sarah UUID := 'u0000000-0000-0000-0000-000000000002'::UUID;
    user_marcus UUID := 'u0000000-0000-0000-0000-000000000003'::UUID;
    space_flow UUID := 's0000000-0000-0000-0000-000000000001'::UUID;
    space_core UUID := 's0000000-0000-0000-0000-000000000002'::UUID;
    sprint_1 UUID := 'sp000000-0000-0000-0000-000000000001'::UUID;
    i INT;
    company_curr_id UUID;
BEGIN
    -- 1. Create Sample Users
    INSERT INTO users (id, email, name, avatar_url) VALUES
    (user_alex, 'alex.chen@flowline.internal', 'Alex Chen', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face'),
    (user_sarah, 'sarah.k@flowline.internal', 'Sarah Koenig', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=face'),
    (user_marcus, 'marcus.v@flowline.internal', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create Primary Companies
    INSERT INTO companies (id, slug, name, plan) VALUES
    (acme_id, 'acme-corp', 'Acme Corporation', 'pro'),
    (linear_id, 'starlight-labs', 'Starlight Labs', 'free')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create ~100 Scaled Multi-Tenant Companies for testing
    FOR i IN 3..100 LOOP
        company_curr_id := ('a0000000-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID;
        INSERT INTO companies (id, slug, name, plan)
        VALUES (company_curr_id, 'tenant-' || i, 'Tenant Org ' || i, 'free')
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- 4. Memberships for Acme Corp
    INSERT INTO company_memberships (company_id, user_id, role) VALUES
    (acme_id, user_alex, 'admin'),
    (acme_id, user_sarah, 'tech_lead'),
    (acme_id, user_marcus, 'engineer')
    ON CONFLICT DO NOTHING;

    -- 5. Primary Spaces for Acme Corp
    INSERT INTO spaces (id, company_id, key, name, description, lead_id, color) VALUES
    (space_flow, acme_id, 'FLOW', 'Flowline Core App', 'Main product experience and App Router frontend', user_alex, '#3b82f6'),
    (space_core, acme_id, 'PLAT', 'Platform Engineering', 'Database, multi-tenancy, and infrastructure', user_sarah, '#8b5cf6')
    ON CONFLICT (company_id, key) DO NOTHING;

    -- 6. Active Sprint for FLOW
    INSERT INTO sprints (id, company_id, space_id, name, goal, start_date, end_date, status, total_points, completed_points) VALUES
    (sprint_1, acme_id, space_flow, 'Sprint 24: High-Scale Engine', 'Complete multi-tenant RLS and Swagger contracts', NOW() - INTERVAL '3 days', NOW() + INTERVAL '11 days', 'active', 48.0, 18.0)
    ON CONFLICT (id) DO NOTHING;

    -- 7. Seed Sample Issues in Acme Corp
    INSERT INTO issues (
        company_id, space_id, issue_number, key, title, description, status, priority, type, 
        assignee_id, reporter_id, sprint_id, story_points, rank, labels, custom_fields
    ) VALUES
    (acme_id, space_flow, 1, 'FLOW-1', 'Migrate backend to 100% free serverless architecture', 'Implement Supabase Postgres, Inngest serverless jobs, and Upstash Redis rate limiting', 'in_progress', 'urgent', 'story', user_alex, user_sarah, sprint_1, 8.0, '0|hzzzzz:', ARRAY['backend', 'scale', 'zero-cost'], '{"sla": "24h", "tier": "p0"}'::JSONB),
    (acme_id, space_flow, 2, 'FLOW-2', 'Integrate Swagger UI at /api/docs', 'Embed interactive OpenAPI 3.0 specification with JWT Bearer and tenant header testing', 'done', 'high', 'story', user_sarah, user_alex, sprint_1, 5.0, '0|i00000:', ARRAY['api', 'docs', 'swagger'], '{"swagger_version": "3.0"}'::JSONB),
    (acme_id, space_flow, 3, 'FLOW-3', 'Audit Row Level Security completeness on all tenant tables', 'Verify RESTRICTIVE policy behavior across company_memberships, spaces, sprints, and issues', 'todo', 'urgent', 'task', user_marcus, user_alex, sprint_1, 5.0, '0|i00001:', ARRAY['security', 'rls', 'postgres'], '{}'::JSONB),
    (acme_id, space_flow, 4, 'FLOW-4', 'Configure Cloudflare R2 presigned upload URL generator', 'S3-compatible object storage with $0 egress fees for issue attachments', 'backlog', 'medium', 'story', user_alex, user_marcus, NULL, 3.0, '0|i00002:', ARRAY['storage', 'cloudflare-r2'], '{}'::JSONB)
    ON CONFLICT (company_id, key) DO NOTHING;

    -- 8. Automation Rules
    INSERT INTO automation_rules (company_id, space_id, name, description, trigger_event, condition_expression, action_payload, enabled) VALUES
    (acme_id, space_flow, 'Auto-close sprint issues', 'Move lingering review tickets to next active sprint', 'STATUS_CHANGED', 'status == "done"', '{"notify": ["assignee"]}'::JSONB, TRUE)
    ON CONFLICT DO NOTHING;

END $$;
