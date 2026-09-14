-- ==============================================================================
-- FLOWLINE — MULTI-TENANT POSTGRESQL 16 SEED DATA
-- Target: Supabase Postgres 16 / Local Postgres
-- ==============================================================================

DO $$
DECLARE
    -- Primary Tenants
    tenant_acme_id    UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    tenant_cus1_id    UUID := 'c0000000-0000-0000-0000-000000000001'::UUID;
    tenant_cus2_id    UUID := 'c0000000-0000-0000-0000-000000000002'::UUID;

    -- Users
    user_alex_id      UUID := '10000000-0000-0000-0000-000000000001'::UUID;
    user_sarah_id     UUID := '10000000-0000-0000-0000-000000000002'::UUID;
    user_marcus_id    UUID := '10000000-0000-0000-0000-000000000003'::UUID;
    user_cus1_id      UUID := '10000000-0000-0000-0000-000000000011'::UUID;
    user_cus2_id      UUID := '10000000-0000-0000-0000-000000000021'::UUID;

    -- Projects
    proj_eng_id       UUID := '20000000-0000-0000-0000-000000000001'::UUID;
    proj_mkt_id       UUID := '20000000-0000-0000-0000-000000000002'::UUID;
    proj_cus1_id      UUID := '20000000-0000-0000-0000-000000000011'::UUID;
    proj_cus2_id      UUID := '20000000-0000-0000-0000-000000000021'::UUID;

    -- Taxonomy IDs
    type_epic_id      UUID := '30000000-0000-0000-0000-000000000001'::UUID;
    type_story_id     UUID := '30000000-0000-0000-0000-000000000002'::UUID;
    type_task_id      UUID := '30000000-0000-0000-0000-000000000003'::UUID;
    type_bug_id       UUID := '30000000-0000-0000-0000-000000000004'::UUID;
    type_subtask_id   UUID := '30000000-0000-0000-0000-000000000005'::UUID;

    status_backlog_id UUID := '40000000-0000-0000-0000-000000000001'::UUID;
    status_todo_id    UUID := '40000000-0000-0000-0000-000000000002'::UUID;
    status_inprog_id  UUID := '40000000-0000-0000-0000-000000000003'::UUID;
    status_inrev_id   UUID := '40000000-0000-0000-0000-000000000004'::UUID;
    status_done_id    UUID := '40000000-0000-0000-0000-000000000005'::UUID;

    prio_highest_id   UUID := '50000000-0000-0000-0000-000000000001'::UUID;
    prio_high_id      UUID := '50000000-0000-0000-0000-000000000002'::UUID;
    prio_medium_id    UUID := '50000000-0000-0000-0000-000000000003'::UUID;
    prio_low_id       UUID := '50000000-0000-0000-0000-000000000004'::UUID;
    prio_lowest_id    UUID := '50000000-0000-0000-0000-000000000005'::UUID;

    sprint_1_id       UUID := '60000000-0000-0000-0000-000000000001'::UUID;
    sprint_2_id       UUID := '60000000-0000-0000-0000-000000000002'::UUID;

    issue_epic_id     UUID := '70000000-0000-0000-0000-000000000001'::UUID;
    issue_story_id    UUID := '70000000-0000-0000-0000-000000000002'::UUID;
    issue_task_id     UUID := '70000000-0000-0000-0000-000000000003'::UUID;
    issue_bug_id      UUID := '70000000-0000-0000-0000-000000000004'::UUID;
    issue_subtask_id  UUID := '70000000-0000-0000-0000-000000000005'::UUID;

    lbl_backend_id    UUID := '80000000-0000-0000-0000-000000000001'::UUID;
    lbl_security_id   UUID := '80000000-0000-0000-0000-000000000002'::UUID;
    lbl_database_id   UUID := '80000000-0000-0000-0000-000000000003'::UUID;

    tid               UUID;
BEGIN
    -- 1. Tenants (Acme, CUS1, CUS2)
    INSERT INTO tenants (id, name, slug, plan) VALUES
    (tenant_acme_id, 'Acme Corporation', 'acme-corp', 'pro'),
    (tenant_cus1_id, 'Customer 1 (CUS1)', 'cus1', 'pro'),
    (tenant_cus2_id, 'Customer 2 (CUS2)', 'cus2', 'free')
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Users
    INSERT INTO users (id, email, full_name, avatar_url) VALUES
    (user_alex_id, 'alex.chen@flowline.internal', 'Alex Chen', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face'),
    (user_sarah_id, 'sarah.k@flowline.internal', 'Sarah Koenig', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=face'),
    (user_marcus_id, 'marcus.v@flowline.internal', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face'),
    (user_cus1_id, 'lead@cus1.com', 'CUS1 Lead Engineer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop'),
    (user_cus2_id, 'lead@cus2.com', 'CUS2 Product Lead', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop')
    ON CONFLICT (email) DO NOTHING;

    -- 3. Tenant Members
    INSERT INTO tenant_members (tenant_id, user_id, role, status) VALUES
    (tenant_acme_id, user_alex_id, 'owner', 'active'),
    (tenant_acme_id, user_sarah_id, 'admin', 'active'),
    (tenant_acme_id, user_marcus_id, 'member', 'active'),
    (tenant_cus1_id, user_cus1_id, 'owner', 'active'),
    (tenant_cus2_id, user_cus2_id, 'owner', 'active')
    ON CONFLICT (tenant_id, user_id) DO NOTHING;

    -- 4. Projects
    INSERT INTO projects (id, tenant_id, key, name, description, lead_id) VALUES
    (proj_eng_id, tenant_acme_id, 'ENG', 'Flowline Core Engine', 'Main ticket management engine, GraphQL/REST APIs, and database', user_alex_id),
    (proj_mkt_id, tenant_acme_id, 'MKT', 'Marketing & Growth', 'Growth campaigns, onboarding flows, and landing pages', user_sarah_id),
    (proj_cus1_id, tenant_cus1_id, 'CUS1', 'CUS1 Main Platform', 'Primary engineering project for Customer 1', user_cus1_id),
    (proj_cus2_id, tenant_cus2_id, 'CUS2', 'CUS2 App Suite', 'Primary software project for Customer 2', user_cus2_id)
    ON CONFLICT (tenant_id, key) DO NOTHING;

    -- 5. Project Members
    INSERT INTO project_members (tenant_id, project_id, user_id, role) VALUES
    (tenant_acme_id, proj_eng_id, user_alex_id, 'lead'),
    (tenant_acme_id, proj_eng_id, user_sarah_id, 'contributor'),
    (tenant_acme_id, proj_eng_id, user_marcus_id, 'contributor'),
    (tenant_acme_id, proj_mkt_id, user_sarah_id, 'lead'),
    (tenant_acme_id, proj_mkt_id, user_marcus_id, 'contributor'),
    (tenant_cus1_id, proj_cus1_id, user_cus1_id, 'lead'),
    (tenant_cus2_id, proj_cus2_id, user_cus2_id, 'lead')
    ON CONFLICT (project_id, user_id) DO NOTHING;

    -- 6. Issue Taxonomy for all tenants
    FOR tid IN SELECT id FROM tenants LOOP
        INSERT INTO issue_types (tenant_id, name, icon, color, hierarchy_level) VALUES
        (tid, 'Epic', 'zap', '#8b5cf6', 2),
        (tid, 'Story', 'bookmark', '#3b82f6', 1),
        (tid, 'Task', 'check-square', '#10b981', 1),
        (tid, 'Bug', 'bug', '#ef4444', 1),
        (tid, 'Subtask', 'corner-down-right', '#6b7280', 0)
        ON CONFLICT (tenant_id, project_id, name) DO NOTHING;

        INSERT INTO issue_statuses (tenant_id, name, category, position) VALUES
        (tid, 'Backlog', 'todo', 0),
        (tid, 'To Do', 'todo', 1),
        (tid, 'In Progress', 'in_progress', 2),
        (tid, 'In Review', 'in_progress', 3),
        (tid, 'Done', 'done', 4)
        ON CONFLICT DO NOTHING;

        INSERT INTO priorities (tenant_id, name, rank, color) VALUES
        (tid, 'Highest', 1, '#CD1317'),
        (tid, 'High', 2, '#E97F33'),
        (tid, 'Medium', 3, '#E2B203'),
        (tid, 'Low', 4, '#2D8738'),
        (tid, 'Lowest', 5, '#4C9AFF')
        ON CONFLICT (tenant_id, name) DO NOTHING;
    END LOOP;

    -- 7. Sprints
    INSERT INTO sprints (id, tenant_id, project_id, name, goal, status, start_date, end_date) VALUES
    (sprint_1_id, tenant_acme_id, proj_eng_id, 'Sprint 24: High-Scale Engine', 'Complete multi-tenant RLS, FTS search, and issue hierarchy', 'active', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days'),
    (sprint_2_id, tenant_acme_id, proj_eng_id, 'Sprint 25: Realtime & Offline Sync', 'Implement WebSocket real-time updates and optimistic mutations', 'planned', CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE + INTERVAL '26 days')
    ON CONFLICT (id) DO NOTHING;

    -- 8. Labels
    INSERT INTO labels (id, tenant_id, name, color) VALUES
    (lbl_backend_id, tenant_acme_id, 'backend', '#3b82f6'),
    (lbl_security_id, tenant_acme_id, 'security', '#ef4444'),
    (lbl_database_id, tenant_acme_id, 'database', '#10b981')
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- 9. Issues (Acme Corporation)
    INSERT INTO issues (
        id, tenant_id, project_id, issue_type_id, status_id, priority_id, 
        summary, description, parent_id, sprint_id, assignee_id, reporter_id, story_points, due_date
    ) VALUES (
        issue_epic_id, tenant_acme_id, proj_eng_id, type_epic_id, status_inprog_id, prio_highest_id,
        'Scalable Multi-Tenant Architecture & RLS',
        'Design and deploy PostgreSQL Row-Level Security, pooled multi-tenancy, and trigger validations',
        NULL, sprint_1_id, user_alex_id, user_alex_id, 40.0, CURRENT_DATE + INTERVAL '30 days'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO issues (
        id, tenant_id, project_id, issue_type_id, status_id, priority_id, 
        summary, description, parent_id, sprint_id, assignee_id, reporter_id, story_points, due_date
    ) VALUES (
        issue_story_id, tenant_acme_id, proj_eng_id, type_story_id, status_inprog_id, prio_high_id,
        'Implement Supabase Postgres connection pooling & RLS policies',
        'Configure connection pooling and create RESTRICTIVE policies verifying app.current_tenant_id',
        issue_epic_id, sprint_1_id, user_sarah_id, user_alex_id, 8.0, CURRENT_DATE + INTERVAL '5 days'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO issues (
        id, tenant_id, project_id, issue_type_id, status_id, priority_id, 
        summary, description, parent_id, sprint_id, assignee_id, reporter_id, story_points, due_date
    ) VALUES (
        issue_task_id, tenant_acme_id, proj_eng_id, type_task_id, status_todo_id, prio_high_id,
        'Audit Row-Level Security policies across all tables',
        'Verify that all 16 tenant tables strictly deny cross-tenant reads and mutations',
        issue_epic_id, sprint_1_id, user_marcus_id, user_sarah_id, 5.0, CURRENT_DATE + INTERVAL '7 days'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO issues (
        id, tenant_id, project_id, issue_type_id, status_id, priority_id, 
        summary, description, parent_id, sprint_id, assignee_id, reporter_id, story_points, due_date
    ) VALUES (
        issue_bug_id, tenant_acme_id, proj_eng_id, type_bug_id, status_backlog_id, prio_medium_id,
        'Fix issue search index weight on description updates',
        'Ensure the sync_issue_search_vector trigger properly recalculates tsvector weights on description edit',
        NULL, NULL, user_alex_id, user_marcus_id, 3.0, CURRENT_DATE + INTERVAL '14 days'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO issues (
        id, tenant_id, project_id, issue_type_id, status_id, priority_id, 
        summary, description, parent_id, sprint_id, assignee_id, reporter_id, story_points, due_date
    ) VALUES (
        issue_subtask_id, tenant_acme_id, proj_eng_id, type_subtask_id, status_todo_id, prio_medium_id,
        'Add benchmark query tests for RLS tenant isolation',
        'Write automated test scripts asserting that tenant B queries cannot see tenant A records',
        issue_task_id, sprint_1_id, user_marcus_id, user_marcus_id, 2.0, CURRENT_DATE + INTERVAL '4 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- 10. Issue Labels
    INSERT INTO issue_labels (issue_id, label_id) VALUES
    (issue_epic_id, lbl_backend_id),
    (issue_epic_id, lbl_security_id),
    (issue_story_id, lbl_backend_id),
    (issue_story_id, lbl_database_id),
    (issue_task_id, lbl_security_id)
    ON CONFLICT (issue_id, label_id) DO NOTHING;

    -- 11. Comments
    INSERT INTO comments (tenant_id, issue_id, author_id, body) VALUES
    (tenant_acme_id, issue_story_id, user_alex_id, 'Make sure to test the RLS policies with both empty and valid app.current_tenant_id settings.'),
    (tenant_acme_id, issue_story_id, user_sarah_id, 'All verified! Benchmark queries confirm zero leakage across tenant boundaries.')
    ON CONFLICT DO NOTHING;

    -- 12. Issue Links (Dependency link)
    INSERT INTO issue_links (tenant_id, issue_id, linked_issue_id, link_type) VALUES
    (tenant_acme_id, issue_story_id, issue_task_id, 'blocks')
    ON CONFLICT (issue_id, linked_issue_id, link_type) DO NOTHING;

    -- 13. Activity Log
    INSERT INTO activity_log (tenant_id, issue_id, actor_id, action, field_name, old_value, new_value) VALUES
    (tenant_acme_id, issue_story_id, user_alex_id, 'status_changed', 'status', 'To Do', 'In Progress'),
    (tenant_acme_id, issue_epic_id, user_alex_id, 'created', NULL, NULL, 'Scalable Multi-Tenant Architecture & RLS')
    ON CONFLICT DO NOTHING;

    -- 14. Automation Rules
    INSERT INTO automation_rules (tenant_id, project_id, name, trigger_event, conditions, actions, is_enabled, created_by) VALUES
    (
        tenant_acme_id, 
        proj_eng_id, 
        'Auto-resolve Parent when Subtasks Done', 
        'issue.status_changed', 
        '{"status": "Done", "has_parent": true}'::JSONB, 
        '[{"action": "check_sibling_subtasks"}]'::JSONB, 
        TRUE, 
        user_alex_id
    )
    ON CONFLICT DO NOTHING;

END $$;
