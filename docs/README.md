# Flowline Documentation Hub

Welcome to the **Flowline** architecture and development documentation. Flowline is a high-performance, scale-ready project management platform built on a Turborepo monorepo stack.

---

## 📚 Table of Contents

### 🏛️ System Architecture
* [**System Architecture Overview**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/system-overview.md) — Unified end-to-end architecture diagram, data flow, and package structure.
* [**Frontend Architecture (1M+ Users Scale)**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md) — Next.js 15 App Router, Server Components by default, virtualization, TanStack Query caching, and real-time SSE.
* [**Backend Architecture ($0 Free Tier Blueprint)**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md) — Zero-cost production infrastructure blueprint using Supabase, Upstash Redis, Inngest serverless jobs, and Cloudflare R2.

---

### 📜 Architecture Decision Records (ADRs)
* [**ADR Template**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/template.md) — Template for proposing and recording architectural decisions.
* [**ADR 0001: Serverless vs. Cloud Docker**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0001-serverless-vs-docker.md) — Rationale for choosing serverless free tiers over expensive multi-container cloud Docker hosting.
* [**ADR 0002: Next.js App Router & Scaling**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/0002-nextjs-app-router-scale.md) — Decision to use Next.js 15 Server Components, virtualization, and cursor pagination.

---

### 🔌 API & Data Contracts
* [**OpenAPI Specs & Swagger**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/api/openapi-specs.md) — Swagger UI interactive testing, OpenAPI 3.0 schema export, and TypeScript SDK client generation.

---

### 🛠️ Developer Guides
* [**Local Development Guide**](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/guides/local-development.md) — Setup instructions, Turborepo commands, workspace organization, and optional local Docker testing.
