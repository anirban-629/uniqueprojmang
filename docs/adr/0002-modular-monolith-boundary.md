# ADR 0002: Modular Monolith with Domain Seams & In-Process Event Bus

* **Status:** Accepted
* **Deciders:** Core Engineering Team
* **Date:** 2026-09-14

---

## Context and Problem Statement
Deploying multiple standalone microservices from day one introduces high operational overhead, distributed transaction challenges, and breaks free-tier hosting limits. Conversely, an unstructured monolith leads to tight coupling across domains, making future microservice migration painful and costly.

We need a backend architecture that runs as **one deployable free-tier application** today, while maintaining the strict module boundaries and event shapes required for straightforward future service extraction.

## Decision Drivers
* Single deployable application on 100% free resources ($0/month).
* Strict module boundaries preventing cross-domain database coupling.
* In-process asynchronous event bus decoupling side effects (automation, notifications, realtime broadcast) from core transaction logic.
* Migration-readiness for future microservice extraction.

## Considered Options
1. **Full Distributed Microservices:** 5–8 separate services communicating over network. High operational complexity and breaks free hosting allowances.
2. **Standard Unstructured Monolith:** All code in one service with shared queries across modules. Causes tight coupling and spaghetti dependencies over time.
3. **Modular Monolith with Domain Seams:** Single deployable Fastify service organized into 8 bounded domain modules (`core`, `auth`, `search`, `realtime`, `automation`, `ai`, `integrations`, `analytics`) communicating via explicit public interfaces and an in-process EventBus.

## Decision Outcome
Chosen option: **Option 3 (Modular Monolith with Domain Seams)**.

### Architectural Rules
1. **8 Domain-Owned Modules:** All backend logic is partitioned into:
   - `core/`: Projects, issues, sprints, comments, decisions.
   - `auth/`: Users, company tenancy, permissions, JWT guards.
   - `search/`: Postgres-native `tsvector` and `pg_trgm` full-text search wrapper.
   - `realtime/`: SSE streams and in-memory ephemeral presence.
   - `automation/`: In-process rule evaluation and idempotency checks.
   - `ai/`: Async LLM API calls and background job queue.
   - `integrations/`: Inbound/outbound webhooks and Supabase storage URLs.
   - `analytics/`: Pre-aggregated health scores and velocity trends.
2. **In-Process Domain EventBus:** Modules publish strongly typed events (`issue:created`, `issue:updated`, etc.). Downstream modules (`automation`, `realtime`, `analytics`) subscribe to events without importing internal core models.
3. **Module Boundaries:** No module imports internal models or helpers of another module directly; all cross-domain communication uses exported public interfaces.

## Links & References
* [Backend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md)
* [ADR 0001: Tenancy Model](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0001-tenancy-model.md)
