# Flowline — System Architecture Overview

This document provides a high-level overview of Flowline's end-to-end architecture, covering how the Next.js frontend, Route Handlers / API, database layer, and third-party managed serverless services integrate.

```mermaid
flowchart TB
    subgraph Clients["Frontend Clients (apps/web)"]
        Browser["Next.js 15 Client (App Router)<br/>React 19, Zustand, TanStack Query"]
        SSR["Next.js Server Components & Edge SSR"]
    end

    subgraph API["API & Routing Layer"]
        Middleware["Edge Middleware<br/>JWT Auth, Rate Limiter Guard"]
        RouteHandlers["Next.js Route Handlers / NestJS API<br/>(/api/*, /api/docs Swagger)"]
    end

    subgraph DataServices["Managed Cloud Serverless ($0 Free Tier)"]
        Postgres[(Supabase PostgreSQL 16<br/>RLS Multi-Tenancy & JSONB)]
        Redis[(Upstash Redis<br/>Sliding Window Rate Limiting)]
        Jobs[Inngest Serverless Engine<br/>Async Event Automations]
        Storage[(Cloudflare R2<br/>S3-Compatible Object Storage)]
        Realtime[Supabase Realtime / SSE<br/>Live Board & Issue Updates]
    end

    subgraph SharedPackages["Turborepo Shared Packages (packages/*)"]
        UI["@flowline/ui<br/>shadcn/ui + Tailwind"]
        Types["@flowline/types<br/>OpenAPI & Entity Contracts"]
        Hooks["@flowline/hooks<br/>Data Fetching & Cache Sync"]
        MockDB["@flowline/mock-db<br/>Seeders & In-Memory Store"]
        Config["@flowline/config<br/>ESLint, TSConfig, Tailwind"]
    end

    Browser --> SSR
    SSR --> Middleware
    Middleware --> RouteHandlers
    RouteHandlers --> Postgres
    RouteHandlers --> Redis
    RouteHandlers --> Jobs
    RouteHandlers --> Storage
    RouteHandlers --> Realtime

    Browser -.-> UI
    Browser -.-> Hooks
    RouteHandlers -.-> MockDB
    RouteHandlers -.-> Types
```

---

## Key System Tenets

1. **Scale-Ready Client Architecture (1M+ Users Target):**
   - Server Components by default to minimize client bundle size (<150KB per route).
   - Cursor-based pagination on all list endpoints.
   - Virtualized rendering for boards and backlogs via `@tanstack/react-virtual`.
   - Read more in [Frontend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md).

2. **Zero-Cost Production Blueprint ($0/Month forever):**
   - Eliminates expensive 24/7 container clusters in the cloud.
   - Leverages Supabase (Postgres + RLS), Upstash (Redis via HTTP), Inngest (serverless jobs), and Cloudflare R2 ($0 egress storage).
   - Read more in [Backend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md).

3. **Contract-First Development:**
   - Swagger / OpenAPI specifications hosted directly at `/api/docs`.
   - Client TypeScript SDK generated automatically for strict type consistency.
   - Read more in [OpenAPI Specs](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/api/openapi-specs.md).
