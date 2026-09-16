# Flowline

> **Scale-Ready, Modern Project Management Platform** built with Next.js 15, Turborepo, TypeScript, and Zero-Cost Serverless Infrastructure.

---

## 📖 Architecture & Documentation

All architectural specifications, decision records, and developer guides are centrally managed in the [`docs/`](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/README.md) directory:

| Section | Description | Link |
|---|---|---|
| **System Overview** | End-to-end architecture diagram & data flows | [System Overview](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/system-overview.md) |
| **Frontend Architecture** | Next.js 15 App Router, Server Components & Virtualization (1M+ Users) | [Frontend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/frontend-architecture.md) |
| **Backend Architecture** | $0/Month Serverless Production Blueprint (Supabase, Upstash, Inngest, R2) | [Backend Architecture](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/architecture/backend-architecture.md) |
| **Architecture Decisions** | Historical ADRs (Decisions, Trade-offs & Drivers) | [ADR Index](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/adr/template.md) |
| **API & Swagger** | Interactive API Testing & TypeScript SDK Generator | [OpenAPI Specs](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/api/openapi-specs.md) |
| **Development Guide** | Quickstart, scripts, and monorepo workspace details | [Local Dev Guide](file:///d:/INT%20OLD-20260720T064034Z-1-001/INT%20OLD/Playground/uniqueprojmang/docs/guides/local-development.md) |

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run local development environment
npm run dev

# 3. Access the web app & Swagger documentation
# App: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

---

## 📦 Monorepo Structure

```text
flowline/
├── apps/
│   ├── web/          # Next.js 15 App Router Frontend & Route Handlers
│   └── api/          # Standalone API service
├── packages/
│   ├── ui/           # Shared shadcn/ui Component Library
│   ├── types/        # Shared TypeScript Interfaces & DTOs
│   ├── hooks/        # React Query Hooks & Cache Invalidation
│   ├── db/           # Database Client, Modular Migrations & Seeders
│   └── config/       # Shared ESLint, TSConfig, and Tailwind Configs
├── docs/             # Central Documentation Hub
├── docker-compose.yml # Optional local offline database/cache
└── turbo.json        # Turborepo Build Pipeline
```
