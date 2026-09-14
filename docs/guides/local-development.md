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
   - Route Handlers & Mock DB: `http://localhost:3000/api/*`
   - Swagger Documentation: `http://localhost:3000/api/docs`

3. **Build the Monorepo:**
   ```bash
   npm run build
   ```

---

## 3. Monorepo Workspaces

```text
├── apps/
│   ├── web/         # Next.js 15 App Router Frontend
│   └── api/         # Standalone API / Backend service
└── packages/
    ├── ui/          # Shared shadcn/ui components
    ├── types/       # Shared TypeScript types & DTOs
    ├── mock-db/     # In-memory realistic dataset generator
    ├── hooks/       # React Query hooks & data fetchers
    ├── db/          # Database clients (Drizzle/Prisma/Supabase)
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
