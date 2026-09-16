# Flowline — Local Development Guide

## 1. Prerequisites
- **Node.js:** v20+ recommended
- **Package Manager:** npm (v10+)
- **Turborepo:** Managed via npm scripts

---

## 2. Quickstart

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   This will start:
   - Next.js Web App: `http://localhost:3000`
   - Fastify Backend API: `http://localhost:4000`
   - Swagger Documentation: `http://localhost:4000/docs`

3. **Build the Monorepo:**
   ```bash
   npm run build
   ```

---

## 3. Monorepo Workspaces

```text
├── apps/
│   ├── web/         # Next.js 15 App Router Frontend
│   └── api/         # Fastify Modular Monolith Backend service
└── packages/
    ├── ui/          # Shared shadcn/ui components
    ├── types/       # Shared TypeScript types & DTOs
    ├── hooks/       # React Query hooks & data fetchers
    ├── db/          # Database client, PostgreSQL schemas & seeders
    └── config/      # Shared Tailwind, ESLint, TSConfig
```

---

## 4. Optional: Local Docker Services

If you wish to test with a local PostgreSQL / Redis instance offline:

```bash
docker compose up -d
```

> [!NOTE]
> Docker is **only** for optional local development. Production deployments use 100% serverless free tiers (Supabase, Upstash, Vercel).
