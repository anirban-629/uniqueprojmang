# ADR 0002: Next.js 15 App Router & Scale-First Frontend Patterns (1M+ Users)

* **Status:** Accepted
* **Deciders:** Core Engineering Team
* **Date:** 2026-09-14

---

## Context and Problem Statement
Earlier frontend planning considered a standard client-rendered React/Vite SPA. However, at scale (target: 1M+ users, 50k+ issues per project), heavy client JavaScript bundles and unoptimized client-side data fetching degrade performance and inflate infrastructure load.

## Decision Drivers
* Minimal JavaScript payload per route (<150KB gzipped).
* Fast First Contentful Paint (FCP) and Largest Contentful Paint (LCP) via Server-Side Rendering (SSR).
* Ability to handle large data sets (e.g. 10,000+ issues in backlog/board) smoothly without UI freezing.
* Monorepo modularity to support separate future sub-apps (e.g., service-desk, admin portal).

## Considered Options
1. **React / Vite SPA:** Simple initial setup, but all JavaScript and state libraries are bundled to the client. Initial load times suffer, and client-side data fetching lacks Edge caching advantages.
2. **Next.js 15 App Router with Server Components by default:** Hybrid architecture leveraging Server Components for static shells and fast SSR, with Client Components isolated only to interactive islands.

## Decision Outcome
Chosen option: **Option 2 (Next.js 15 App Router)**.

### Architectural Rules Adopted
* **Server Components by Default:** Only add `"use client"` when component state, effects, or browser events are required.
* **Cursor Pagination:** No offset pagination (`?page=N`) allowed on any list endpoint.
* **Virtualization:** All large lists (Board columns > 50 cards, Backlog items) must be virtualized using `@tanstack/react-virtual`.
* **Two-Tier Caching:** Server-side Next.js `fetch` caching (`revalidateTag`) paired with TanStack Query on the client for optimistic updates and real-time cache invalidation.

## Links & References
* [Frontend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md)
