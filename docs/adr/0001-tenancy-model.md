# ADR 0001: Pooled Multi-Tenancy with Row-Level Security (RLS)

* **Status:** Accepted
* **Deciders:** Core Engineering Team
* **Date:** 2026-09-14

---

## Context and Problem Statement
Flowline is designed as a multi-tenant project management platform capable of serving hundreds of independent companies on a $0/month free-tier infrastructure. We must prevent cross-tenant data leakage while avoiding the cost and operational overhead of maintaining separate database instances or separate schemas per tenant.

## Decision Drivers
* Zero-cost hosting ($0/month) on shared Supabase / PostgreSQL free tiers.
* Ironclad data isolation: application-level bugs (e.g. omitted `WHERE tenant_id = ?` clause) must never leak data across tenants.
* Straightforward developer experience and unified migrations.

## Considered Options
1. **Database-per-Tenant:** Completely separate database for each company. Extreme operational complexity and completely exceeds free-tier limits.
2. **Schema-per-Tenant:** Separate PostgreSQL schema per company within one database. High migration complexity and connection overhead.
3. **Pooled Multi-Tenancy with Row-Level Security (RLS):** All tenants share tables, with mandatory `tenant_id` on every table and PostgreSQL Row-Level Security (RLS) policies enforced in the database engine.

## Decision Outcome
Chosen option: **Option 3 (Pooled Multi-Tenancy with PostgreSQL RLS)**.

### Implementation Details
* **Tenant Column:** Every table (including junction, audit, and comment tables) contains a `tenant_id` column.
* **RLS Policies:** PostgreSQL Row-Level Security is enabled on all tables:
  ```sql
  ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_policy ON issues
      AS RESTRICTIVE
      USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
      WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));
  ```
* **Context Injection:** Inbound requests extract `tenant_id` from signed JWT claims or the `x-tenant-id` header in the Fastify `tenancyPlugin`.

### Positive Consequences
* Zero extra infrastructure cost on Supabase / Neon free tiers.
* Database-enforced security guarantee that isolates tenant rows even if application code has query bugs.

### Negative Consequences & Mitigations
* *Shared table indexes:* GIN and B-Tree composite indexes must lead with `tenant_id` to ensure optimal query performance.

## Links & References
* [Backend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md)
* [ADR 0002: Modular Monolith Boundaries](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0002-modular-monolith-boundary.md)
