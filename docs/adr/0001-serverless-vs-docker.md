# ADR 0001: Zero-Cost Serverless Cloud Architecture vs. Persistent Docker Containers

* **Status:** Accepted
* **Deciders:** Core Engineering Team
* **Date:** 2026-09-14

---

## Context and Problem Statement
Previous architectural proposals involved deploying 4–7 persistent Docker containers in the cloud (NestJS API, BullMQ worker, Postgres, Redis, MinIO, Grafana/Prometheus/Loki). Container hosting platforms (Railway, Render, Fly.io, AWS) charge $20–$50+/month for persistent workers, background polling, and observability clusters.

We needed an architecture capable of running multi-tenant workloads for ~100 companies at **$0/month forever**.

## Decision Drivers
* Total Infrastructure Cost must be $0.00/month.
* Production stability without 50+ second container cold starts.
* Support for background jobs without running 24/7 Node.js worker containers.
* Multi-tenant data security and rate limiting.

## Considered Options
1. **Cloud Multi-Container Docker (Render/Railway/AWS ECS):** Requires paid plans ($20–$50/mo minimum) for persistent BullMQ workers and Redis.
2. **100% Serverless Managed Free Tiers:** Next.js Route Handlers on Vercel + Supabase (Postgres with RLS) + Upstash (Redis over HTTP) + Inngest (Serverless event jobs via webhooks) + Cloudflare R2.

## Decision Outcome
Chosen option: **Option 2 (Serverless Managed Free Tiers)**.

### Positive Consequences
* $0.00/month operating expenditure.
* Zero cold starts via Vercel Edge/Serverless routing.
* Inngest executes background automations via HTTP webhooks, eliminating the need for 24/7 BullMQ worker processes.
* Supabase Row-Level Security (RLS) handles tenant isolation natively inside PostgreSQL.

### Negative Consequences & Mitigations
* *Serverless connection exhaustion:* Mitigated with Supabase PgBouncer / Supavisor connection pooling and Upstash REST API calls.
* *Local development offline story:* `docker-compose.yml` is retained strictly for local development without deploying to the cloud.

## Links & References
* [Backend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md)
