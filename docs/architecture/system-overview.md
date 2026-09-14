# Flowline — System Architecture Overview

This document provides a high-level overview of Flowline's end-to-end architecture, covering the Next.js frontend, the Modular Backend Monolith, data services, and Turborepo shared packages.

```mermaid
flowchart TB
    subgraph Clients["Frontend Client (apps/web)"]
        Browser["Next.js 15 Client (App Router)<br/>React 19, Zustand, TanStack Query"]
        SSR["Server Components & Edge SSR"]
    end

    subgraph BackendMonolith["Modular Backend Monolith (apps/api - Fastify Port 4000)"]
        Auth["auth/ — JWT & Tenant Guard (RLS)"]
        Core["core/ — Projects, Issues, Sprints, Comments, Decisions"]
        Search["search/ — Postgres tsvector & pg_trgm"]
        Realtime["realtime/ — SSE Stream & Presence"]
        Auto["automation/ — Sandboxed Rule Evaluator"]
        AI["ai/ — Async LLM Job Queue"]
        Integrations["integrations/ — Webhooks & Supabase Storage"]
        Analytics["analytics/ — Weather Map & Velocity Rollups"]
        EventBus["In-Process EventBus (events/)"]
    end

    subgraph DataServices["Free-Tier Cloud Infrastructure ($0/Mo)"]
        Postgres[(Supabase Postgres 16<br/>RLS Multi-Tenancy & GIN Indexes)]
        Redis[(Upstash Redis<br/>Sliding Window Rate Limiting)]
        Storage[(Supabase Storage<br/>S3-Compatible Object Storage with RLS)]
    end

    subgraph SharedPackages["Turborepo Shared Packages (packages/*)"]
        DB["@flowline/db<br/>Modular Schemas, RLS & Migration Tooling"]
        UI["@flowline/ui<br/>shadcn/ui + Tailwind"]
        Types["@flowline/types<br/>OpenAPI, DTOs & Domain Events"]
        Hooks["@flowline/hooks<br/>TanStack Query Fetchers"]
        MockDB["@flowline/mock-db<br/>Seeders & In-Memory Store"]
        Config["@flowline/config<br/>ESLint, TSConfig, Tailwind"]
    end

    Browser --> SSR
    SSR -->|/api/* Requests| BackendMonolith
    Core --> EventBus
    EventBus --> Realtime
    EventBus --> Auto
    EventBus --> Analytics

    BackendMonolith --> DB
    DB --> Postgres
    BackendMonolith --> Redis
    BackendMonolith --> Storage

    Browser -.-> UI
    Browser -.-> Hooks
    BackendMonolith -.-> Types
    BackendMonolith -.-> MockDB
```

---

## Key System Tenets

1. **Modular Monolith with Migration Seams:**
   - Single deployable Fastify application divided into 8 bounded domain modules.
   - Decoupled in-process EventBus for asynchronous side effects without cross-module DB imports.
   - Read more in [Backend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md) and [ADR 0002](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0002-modular-monolith-boundary.md).

2. **Pooled Multi-Tenancy with Row-Level Security (RLS):**
   - Mandatory `tenant_id` on all tables enforced by database-level PostgreSQL RLS policies (`FORCE ROW LEVEL SECURITY`).
   - Modular SQL migrations partitioned by domain in `@flowline/db` (`packages/db/schemas/`).
   - Read more in [ADR 0001](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0001-tenancy-model.md).

3. **Scale-Ready Client Architecture (1M+ Users Target):**
   - Server Components by default (<150KB initial JS payload per route).
   - Cursor-based pagination and virtualized list rendering.
   - Read more in [Frontend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md).

4. **Contract-First Development:**
   - OpenAPI 3.0 / Swagger UI hosted directly at `/docs`.
   - Read more in [OpenAPI Specs](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/api/openapi-specs.md).
