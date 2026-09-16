# Flowline Documentation Hub

Welcome to the **Flowline** architecture and development documentation. Flowline is a high-performance, scale-ready project management platform built on a Turborepo monorepo stack.

---

## Table of Contents

### System Architecture
* [**System Architecture Overview**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/system-overview.md) — Unified end-to-end architecture diagram, data flow, and package structure.
* [**Backend Architecture (Free-Tier Modular Monolith)**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md) — Migration-ready modular monolith with 8 domain-owned modules, in-process EventBus, and migration checklist.
* [**Frontend Architecture (1M+ Users Scale)**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md) — Next.js 15 App Router, Server Components by default, virtualization, TanStack Query caching, and real-time SSE.

---

### Architecture Decision Records (ADRs)
* [**ADR Template**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/template.md) — Template for proposing and recording architectural decisions.
* [**ADR 0001: Tenancy Model (Pooled RLS)**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0001-tenancy-model.md) — Rationale for pooled multi-tenancy with PostgreSQL Row-Level Security.
* [**ADR 0002: Modular Monolith Boundaries**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0002-modular-monolith-boundary.md) — Decision to structure the backend as a modular monolith with domain seams and an in-process EventBus.

---

### API & Data Contracts
* [**OpenAPI Specs & Swagger**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/api/openapi-specs.md) — Swagger UI interactive testing, OpenAPI 3.0 schema export, and TypeScript SDK client generation.

---

### Developer Guides
* [**Local Development Guide**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/guides/local-development.md) — Setup instructions, Turborepo commands, workspace organization, and optional local Docker testing.

---

### Domain Modules
* [**Module Documentation Index**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/modules/README.md) — Master index of all backend domain modules, technical contracts, interfaces, and state lifecycles.

