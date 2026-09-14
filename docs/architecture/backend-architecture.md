# Flowline Backend Architecture — Free-Tier Modular Monolith (Migration-Ready)

> **Principle:** One deployable application, one free database, zero paid infrastructure ($0/month) — built with strict internal discipline (layered architecture: `routes` → `controller` → `service` → `repository` → `events`/`state`, tenant isolation, domain event contracts) that makes migrating to a service-per-domain architecture later a matter of extraction, not rewrite.
>
> **Related Documents:**
> - [System Overview](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/system-overview.md)
> - [Frontend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md)
> - [ADR 0001: Tenancy Model](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0001-tenancy-model.md)
> - [ADR 0002: Modular Monolith Boundaries](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0002-modular-monolith-boundary.md)
> - [OpenAPI Specs & API Contracts](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/api/openapi-specs.md)

---

## 1. Phase 0: Tenancy Model

* **Model:** Pooled multi-tenancy — all companies share tables, strictly isolated by `tenant_id`.
* **Enforcement:** `tenant_id` column present on every table (including junction and audit tables).
* **PostgreSQL Row-Level Security (RLS):** Policies are enforced at the database layer so application bugs cannot leak cross-tenant data even if an application query omits `WHERE tenant_id = ?`:

```sql
-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Enforce tenant isolation via current session setting
CREATE POLICY tenant_isolation_policy ON issues
    AS RESTRICTIVE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));
```

---

## 2. Phase 1: Modular Layered Architecture

The backend (`apps/api`) follows a standardized, strongly typed 5-tier layer separation per domain module:

```
apps/api/src/
├── config/
│   ├── env.config.ts            # Strongly-typed environment variables
│   ├── cors.config.ts           # Fastify CORS configuration
│   └── swagger.config.ts        # OpenAPI 3.0 & Swagger UI configuration
│
├── shared/
│   ├── errors/                  # AppError, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError, ConflictError
│   ├── types/                   # TenantContext, PaginationQuery, ApiResponseMeta
│   ├── event-bus.ts             # In-process Domain Event Bus
│   └── logger.ts                # Centralized Pino + Axiom multi-stream structured logger
│
├── plugins/
│   ├── tenancy.plugin.ts        # Tenant extraction & Fastify request decoration
│   ├── rate-limit.plugin.ts     # Encapsulated sliding-window tenant rate limiter
│   └── error-handler.plugin.ts  # Global error-to-HTTP status mapping
│
├── health/
│   ├── health.types.ts          # Health response DTOs
│   ├── health.service.ts        # Pure Postgres, Redis, Supabase, and memory checks
│   ├── health.controller.ts     # Health request/reply controller
│   ├── health.routes.ts         # /health and /api/health route bindings
│   └── index.ts
│
├── modules/
│   ├── core/                    # Projects, issues, sprints, comments, decisions
│   │   ├── core.types.ts        # DTOs & typed Fastify route generics
│   │   ├── core.schema.ts       # Fastify JSON validation schemas
│   │   ├── core.repository.ts   # Isolated data access (mockDb / Postgres)
│   │   ├── core.events.ts       # Event publishing helpers & payload types
│   │   ├── core.service.ts      # Pure business rules (Zero Fastify imports)
│   │   ├── core.controller.ts   # Typed Fastify HTTP handler
│   │   ├── core.routes.ts       # Clean URL-to-schema-to-controller mapping
│   │   └── index.ts
│   │
│   ├── auth/                    # Users, tenancy context, companies
│   │   ├── auth.types.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   │
│   ├── automation/              # Sandboxed rule evaluation, event listeners, idempotency
│   │   ├── automation.types.ts
│   │   ├── automation.schema.ts
│   │   ├── automation.state.ts  # Encapsulated AutomationRuleStore & Idempotency cache
│   │   ├── automation.evaluator.ts # Pure safe expression evaluator
│   │   ├── automation.events.ts # EventBus subscription listener
│   │   ├── automation.service.ts
│   │   ├── automation.controller.ts
│   │   ├── automation.routes.ts
│   │   └── index.ts
│   │
│   ├── realtime/                # In-process events, SSE streams, ephemeral presence
│   │   ├── realtime.types.ts
│   │   ├── realtime.schema.ts
│   │   ├── realtime.presence.state.ts # Encapsulated PresenceStore class
│   │   ├── realtime.sse.ts      # SSE protocol streaming & keep-alive manager
│   │   ├── realtime.events.ts   # EventBus listeners piping to realtimeHub
│   │   ├── realtime.service.ts
│   │   ├── realtime.controller.ts
│   │   ├── realtime.routes.ts
│   │   └── index.ts
│   │
│   ├── ai/                      # LLM API callers, async background job queue
│   │   ├── ai.types.ts
│   │   ├── ai.schema.ts
│   │   ├── ai.state.ts          # Encapsulated AIJobQueue
│   │   ├── ai.worker.ts         # Job execution worker
│   │   ├── ai.service.ts
│   │   ├── ai.controller.ts
│   │   ├── ai.routes.ts
│   │   └── index.ts
│   │
│   ├── search/                  # Postgres full-text search (tsvector + pg_trgm)
│   │   ├── search.types.ts
│   │   ├── search.schema.ts
│   │   ├── search.repository.ts
│   │   ├── search.service.ts
│   │   ├── search.controller.ts
│   │   ├── search.routes.ts
│   │   └── index.ts
│   │
│   ├── integrations/            # Inbound webhooks, Supabase storage URLs
│   │   ├── integrations.types.ts
│   │   ├── integrations.schema.ts
│   │   ├── integrations.storage.ts # Storage signed URL generator
│   │   ├── integrations.service.ts
│   │   ├── integrations.controller.ts
│   │   ├── integrations.routes.ts
│   │   └── index.ts
│   │
│   └── analytics/               # Pre-aggregated health metrics & velocity trends
│       ├── analytics.types.ts
│       ├── analytics.schema.ts
│       ├── analytics.repository.ts
│       ├── analytics.service.ts
│       ├── analytics.controller.ts
│       ├── analytics.routes.ts
│       └── index.ts
│
├── app.ts                       # Fastify application builder
└── index.ts                     # Lightweight server startup (~17 lines)
```

### Layer Responsibilities

| Layer | Allowed to do | NOT allowed to do |
| :--- | :--- | :--- |
| `routes.ts` | Register route, bind schema, bind controller handler | Any logic, any DB call, any `as any` |
| `controller.ts` | Read typed `request.params/query/body`, call service, set HTTP status/response shape | Business logic, direct DB access, event publishing |
| `service.ts` | Business rules, orchestration, calls repository + event-bus, throws domain errors | Import anything from `fastify`, touch `request`/`reply` |
| `repository.ts` | DB/mockDb queries only, returns domain types | Business logic, HTTP validation, event publishing |
| `events.ts` | Define event payload shapes, subscribe handlers that call into `service.ts` | Route/HTTP concerns |
| `state.ts` | Encapsulate in-memory state, TTL evictions, idempotency caches | Route/HTTP concerns |

```mermaid
flowchart TD
    Client["Client Apps (Web Next.js / Mobile)"] --> API["Fastify Modular Monolith (Port 4000)"]
    
    subgraph API["Fastify Modular Monolith (@flowline/api)"]
        Auth["modules/auth<br/>(Routes → Controller → Service → Repo)"]
        Core["modules/core<br/>(Routes → Controller → Service → Repo)"]
        Search["modules/search<br/>(Routes → Controller → Service → Repo)"]
        Realtime["modules/realtime<br/>(Routes → Controller → Service → PresenceStore)"]
        Auto["modules/automation<br/>(Routes → Controller → Service → RuleStore)"]
        AI["modules/ai<br/>(Routes → Controller → Service → JobQueue)"]
        Integrations["modules/integrations<br/>(Routes → Controller → Service → StorageHelper)"]
        Analytics["modules/analytics<br/>(Routes → Controller → Service → Repo)"]
        
        EventBus["In-Process EventBus<br/>(eventBus.publish / subscribe)"]
    end

    Core -->|Emits issue:created / issue:updated| EventBus
    EventBus -->|Async Event Dispatch| Realtime
    EventBus -->|Async Event Dispatch| Auto
    EventBus -->|Async Event Dispatch| Analytics

    API -->|RLS + JSONB| DB[(Supabase Postgres 16)]
    API -->|Sliding Window| Cache[(Upstash Redis Free Tier)]
    API -->|Async Jobs| Queue[(In-Process Queue / QStash)]
    API -->|Signed URLs| Storage[(Supabase Storage)]
```

---

## 3. Key Domain Capabilities

### 3.1 Module Boundaries (Seam Enforcement)
* No code outside a module imports its internal database models directly.
* Cross-module interactions occur strictly through exported module interfaces (`index.ts`) or asynchronous domain events.

### 3.2 Auth & In-Memory Verification
* Validate JWTs in-process (signature + expiry) with zero database round-trips for basic request authentication.
* Cache tenant permissions with short TTL in memory / Upstash Redis free tier.

### 3.3 Search — Postgres-Native (tsvector & pg_trgm)
* High-performance full-text search with `tsvector` + GIN index, and `pg_trgm` for fuzzy and partial matching.
* Abstracted behind the `search` module interface so swapping to Elasticsearch in v2 requires zero calling-code rewrites.

### 3.4 Realtime & Ephemeral Presence
* In-process EventBus subscriptions piped to SSE streams (`/api/realtime`).
* Ephemeral collaboration state (`PresenceStore`: cursor positions, presence heartbeats) is kept strictly in-memory or Redis, never persisted to PostgreSQL.

### 3.5 Automation — Event-Driven & Sandboxed
* Subscribes to in-process domain events.
* Sandboxed, timeout-bounded rule execution (`evaluateRuleSafely`, no `eval`) and idempotency tracking (`AutomationRuleStore`) to prevent duplicate actions on retry.

### 3.6 AI Features — Asynchronous & Budget-Aware
* Issue summarization and subtask generation dispatched via async background jobs (`/api/ai/summarize`).
* Tenant context isolated per prompt with token usage tracking.

### 3.7 Analytics — Pre-Aggregated Rollups
* Reports and Weather Map summaries are pre-aggregated (representing PostgreSQL materialized views) rather than computed dynamically on client requests.

### 3.8 Observability & Centralized Structured Logging (Pino + Axiom)
* **Pino Multi-Stream Pipeline:** `apps/api/src/shared/logger.ts` configures a high-performance, non-blocking multi-stream architecture:
  * **Local Development:** Human-readable colorized output via `pino-pretty`.
  * **Production Console:** Raw NDJSON output piped to `process.stdout` for container log collectors.
  * **Remote Cloud Ingestion (Axiom Free Tier):** A resilient, debounced batch stream (200ms buffer window) shipping logs directly to Axiom's Ingestion API (`https://api.axiom.co/v1/datasets/{dataset}/ingest`).
* **Multi-Tenant Context & Trace Propagation:**
  * Incoming HTTP requests automatically receive a unique `traceId` (extracted from `x-request-id` or generated via UUIDv4).
  * Fastify's `tenancy.plugin.ts` decorates `request.log` with `{ traceId, tenantId, companyId, userId, role }` so every log line is fully queryable across tenant boundaries.
  * Domain services, background queues, and EventBus subscribers utilize `createChildLogger(moduleName)` to maintain contextual diagnostic trails without passing HTTP request objects into business logic.
* **PII & Secret Redaction:**
  * Built-in Pino redaction filters out sensitive fields (`req.headers.authorization`, `x-company-id`, `x-tenant-id`, `password`, `token`, `secret`, `apiKey`), masking them as `[REDACTED]` prior to serialization.
* **Fail-Safe Ingestion:** Network failures or API token misconfigurations in the remote Axiom stream are caught asynchronously, ensuring logging never crashes the backend service or degrades API response times.

---

## 4. Suggested 100% Free-Tier Stack ($0/Month)

| Component | Free Provider | Free Tier Allowance | Purpose |
|---|---|---|---|
| **Database** | **Supabase** | 500 MB Postgres 16 + connection pooling | PostgreSQL with Row-Level Security (RLS) and tsvector search |
| **Compute / API** | **Fastify Monolith / Vercel** | Free tier web service / serverless | Single deployable backend monolith |
| **API Documentation** | **Swagger UI / OpenAPI 3.0** | Built-in via `@fastify/swagger` | Hosted at `/docs` with interactive JWT testing |
| **Cache & Rate Limit** | **Upstash Redis** | 10,000 commands/day via REST | Multi-tenant sliding window rate limiter |
| **Storage** | **Supabase Storage** | 1 GB storage + RLS access control | Attachment uploads via signed URLs |
| **Observability & Logs** | **Axiom Free Tier** | 0.5 GB/day ingest + 30-day retention | Centralized JSON log query engine, audit trails, and live telemetry |
| **Async Jobs** | **In-Process Queue / Upstash QStash** | Free tier | Asynchronous AI jobs and automation execution |

---

## 5. Migration Readiness Checklist

Verify these 5 criteria before extracting any module into a standalone v2 microservice:

- [x] **Clean Boundary:** No code outside the module imports its internal DB models directly (enforced via `index.ts` public exports).
- [x] **Explicit Interface:** All cross-module data requirements go through an explicit `service` function call or domain event, not a shared table join.
- [x] **Documented Domain Events:** Domain events have documented payload schemas (`.events.ts` and `@flowline/types`) and versioning contracts.
- [x] **Decoupled State:** In-memory state structures are encapsulated in class-based `.state.ts` managers with explicit lifecycle APIs.
- [ ] **Concrete Reason for Extraction:** Clear evidence of scaling mismatch, security isolation, or specialized technology requirements (e.g. dedicated AI GPU cluster or Elasticsearch).
