# Flowline — Next.js Frontend Architecture (Scale-Ready, 1M+ Users)

> Supersedes the earlier React/Vite version. This doc assumes: Next.js App Router, no real backend yet (mock layer via Route Handlers), but every decision is made as if 1M users are live on day one — so nothing needs architectural rework later, only backend swap-in.

---

## 1. The Core Scaling Principle

At 1M users, the two things that actually break apps are **(a) sending too much data/JS to the client** and **(b) hammering a database/API with naive fetch patterns**. Both are frontend architecture problems, not just backend ones. So this doc optimizes for:
- Minimal client JS per route (Server Components by default)
- Aggressive, correct caching (CDN + Next cache + React Query)
- Data contracts that scale (cursor pagination, not offset; not fetching full lists ever)
- UI patterns that stay fast with large datasets (virtualization, not rendering 10,000 DOM nodes)

Even the **mock backend must be built like a real one** (rate limits, cursor pagination, realistic payload sizes) — otherwise you optimize the FE against fake, too-easy data shapes and it breaks the moment a real backend replaces it.

---

## 2. Tech Stack

| Layer | Choice | Why for scale |
|---|---|---|
| Framework | Next.js 15, App Router | Server Components cut client JS drastically; built-in streaming, ISR |
| Hosting | Vercel (or self-hosted on multi-region k8s later) | Edge network, automatic CDN caching, edge middleware |
| Language | TypeScript strict | Non-negotiable at this scale — type drift across a 1M-user app is a production-incident generator |
| Styling | Tailwind + shadcn/ui | Small CSS footprint, no runtime CSS-in-JS cost |
| Server data | TanStack Query (client) + native `fetch` caching (server) | Two-tier caching: Next.js dedupes/caches server fetches, React Query handles client-side revalidation |
| Client UI state | Zustand | Negligible bundle size vs Redux |
| Mock backend (now) | Next.js Route Handlers (`app/api/*/route.ts`) | Real HTTP endpoints — same contract a real backend will have |
| Large lists | `@tanstack/react-virtual` | Boards/backlogs must render only visible rows — non-negotiable past a few hundred issues |
| Drag & drop | `@dnd-kit` | Works well with virtualization, unlike some alternatives |
| Charts | Recharts (lazy-loaded) | Defer chart JS until report pages are visited |
| Graph view | React Flow (lazy-loaded) | Heavy lib — must be code-split, never in main bundle |
| Real-time (future) | SSE or WebSocket via a pub-sub layer (Ably/Pusher/self-hosted Redis) | Build the FE hook now (`useRealtimeIssueUpdates`), point it at a mock SSE route today |
| Auth | Clerk or NextAuth (Auth.js) with edge-compatible sessions | Session checks must run in Edge Middleware, not add DB round-trips per request |
| Feature flags | Unleash or LaunchDarkly (or a simple mock flag service for now) | 1M users means you canary-release, never big-bang deploy |
| Observability | Sentry + Vercel Analytics + Web Vitals reporting | You cannot fix what you can't see at this scale |
| Monorepo tooling | Turborepo | You will eventually split admin/service-desk/main-app; structure for it now |

---

## 3. Monorepo Structure

Even single-app-for-now, structure as a monorepo so teams/apps can split later without a migration project.

```
flowline/
├── apps/
│   └── web/                        # The Next.js app itself
│       ├── app/
│       │   ├── (marketing)/        # Public pages — fully static/ISR
│       │   ├── (app)/              # Authenticated app shell
│       │   │   ├── dashboard/
│       │   │   ├── projects/[projectId]/
│       │   │   │   ├── backlog/
│       │   │   │   ├── board/
│       │   │   │   ├── roadmap/
│       │   │   │   ├── graph/
│       │   │   │   └── decisions/
│       │   │   ├── org/weather-map/
│       │   │   ├── service-desk/
│       │   │   ├── reports/[type]/
│       │   │   ├── automation/
│       │   │   ├── settings/
│       │   │   └── admin/
│       │   ├── api/                # MOCK BACKEND — route handlers
│       │   │   ├── issues/route.ts
│       │   │   ├── issues/[id]/route.ts
│       │   │   ├── sprints/route.ts
│       │   │   ├── projects/route.ts
│       │   │   ├── automation/route.ts
│       │   │   └── realtime/route.ts   # SSE mock stream
│       │   ├── layout.tsx
│       │   └── middleware.ts       # Edge auth check, rate-limit headers
│       └── next.config.ts
│
├── packages/
│   ├── ui/                         # Shared shadcn/ui-based component library
│   ├── types/                      # Shared TS types/interfaces (Issue, Sprint, User...)
│   ├── config/                     # Shared eslint/tailwind/tsconfig
│   ├── mock-db/                    # In-memory data store + seed generators, used by route handlers
│   └── hooks/                      # Shared data-fetching hooks (useIssues, useBoard, etc.)
│
├── turbo.json
└── package.json
```

**Why this matters at 1M users:** when it's time to peel off `service-desk` into its own deployable app, or share `packages/ui` with a marketing site or mobile web view, you're not refactoring — you're just adding another `apps/*` folder.

---

## 4. Rendering Strategy (this is where most scaling decisions actually live)

| Page type | Strategy | Reasoning |
|---|---|---|
| Marketing/landing pages | Static + ISR (revalidate: 3600) | Zero server cost per request, served from CDN edge |
| Dashboard | Server Component shell + Client Components for live widgets | Initial HTML has real content (fast LCP), interactivity hydrates only where needed |
| Board / Backlog | Client Component (highly interactive: drag-drop, live filters) | But wrapped in a Server Component that does the *first* data fetch, so first paint isn't a loading spinner |
| Issue Detail | Server Component for the static shell (fields, description) + Client Component for comments/activity | Comments update frequently; fields don't — don't re-render/refetch the whole page for a new comment |
| Reports/Charts | Client Component, lazy-loaded (`next/dynamic`) | Recharts/heavy viz code should never be in the initial bundle for users who never open Reports |
| Dependency Graph | Client Component, lazy-loaded, virtualized rendering for >200 nodes | React Flow is heavy; must be split out entirely |
| Admin pages | Server Component, low-traffic | Not worth optimizing aggressively — few users hit this |

**Rule for the agent:** default every new component to a Server Component. Only add `"use client"` when you need interactivity (state, effects, event handlers, browser APIs). This is the single biggest lever for keeping JS bundles small at scale.

---

## 5. Data Fetching & Caching — Scale-Correct Patterns

### 5.1 Cursor pagination everywhere, never offset
Offset pagination (`?page=4`) gets slower and less consistent as tables grow. Every list endpoint (issues, comments, activity, decisions) must use cursor-based pagination from day one:

```ts
// GET /api/issues?cursor=abc123&limit=50
// → { data: [...], nextCursor: "xyz789" | null }
```

### 5.2 Never fetch "all issues in a project"
Boards must fetch by status/swimlane in bounded pages, not "give me everything and filter client-side." At 1M users, some projects will have 50,000+ issues. Client-side filtering on a full dataset is a scaling bug, not a shortcut.

### 5.3 Three-tier caching model
1. **CDN/edge cache** — for anything shareable across users (rare in a PM tool, mostly marketing pages)
2. **Next.js `fetch` cache + `revalidateTag`** — server-side; when a Route Handler mutates an issue, call `revalidateTag('issues')` so any server-rendered page reflects it without a full rebuild
3. **React Query client cache** — `staleTime` tuned per data type: user profile (long stale time), board state (short/zero — needs freshness), reports (medium — a few minutes is fine)

### 5.4 Optimistic updates for all mutations
Drag-and-drop on a board, editing a field, adding a comment — all should update the UI instantly via React Query's `onMutate`, then reconcile with the server response. At scale, network latency variance is real; waiting for round-trips on every interaction feels broken.

### 5.5 Rate-limit-aware client
Even against the mock backend, build request handling assuming `429` responses can happen (add this to a couple of mock handlers deliberately). The client should back off and retry gracefully, not just error out — this behavior needs to exist before real traffic finds the gap.

---

## 6. Handling Large Data Volumes in the UI

- **Board columns**: virtualize with `react-virtual` once a column exceeds ~50 visible cards — don't render 2,000 DOM nodes for a busy "To Do" column.
- **Backlog**: virtualized list, windowed rendering, cursor-paginated fetch on scroll.
- **Activity feed / comments**: paginate with "load more," never fetch full history by default.
- **Weather Map**: pre-aggregate on the backend (even the mock one) — never ship raw per-issue data to the client to compute team health client-side. The endpoint should return `{ teamId, velocityTrend, staleTicketPct, blockerCount }`, already summarized.
- **Dependency Graph**: for projects with hundreds of nodes, default to showing only the direct neighbors of the currently focused issue, with an explicit "expand" action, not the entire graph at once.

---

## 7. Real-Time Updates — Next.js-Native (SSE)

Don't build board/issue updates on aggressive polling (`setInterval` fetch every 2s) — this is the fastest way to fall over at 1M concurrent-ish users. Build this natively in Next.js, no external real-time service required for v1:

- `app/api/realtime/route.ts` returns a `ReadableStream` and sets `Content-Type: text/event-stream`. It pushes an event whenever `mock-db` mutates an issue/board (the same Route Handlers that handle PATCH/POST calls also push to this stream).
- Client side: `useRealtimeUpdates(projectId)` opens an `EventSource` connection, and on message, calls `queryClient.invalidateQueries` (or directly patches the React Query cache) so the board/issue UI updates live without a refetch-everything call.
- Fall back to polling only as a degraded mode if the `EventSource` connection drops repeatedly, not as the primary strategy.

**The one real constraint this creates:** Vercel's serverless functions have execution time limits, and a long-lived SSE connection is, by definition, long-lived. Two paths, pick one now so the agent doesn't build against the wrong assumption:
- **Path A (simplest, works today):** Deploy on Vercel using their **Edge Runtime** for this specific route (`export const runtime = 'edge'`) — edge functions handle long-lived streaming connections better than standard serverless functions. Fine for moderate concurrent connections.
- **Path B (needed once real-time concurrency gets large):** Self-host this one route (or the whole app) on a persistent Node server (e.g., a small dedicated service behind the same Next.js app, or a Node server on Railway/Fly/EC2) since a single long-running process can hold many open SSE connections far more cheaply than serverless invocations. You can keep everything else on Vercel and just carve out this one endpoint later — the client-side `useRealtimeUpdates` hook doesn't change either way, only the deployment target of that route.

For now: build Path A. It's zero extra infrastructure and proves the pattern end-to-end. Revisit only when concurrent connection count actually becomes a cost/limit issue.

---

## 8. Performance Budgets (enforce these, don't just aspire to them)

| Metric | Target |
|---|---|
| JS shipped per route (initial) | < 150KB gzipped |
| LCP | < 2.0s on 4G |
| TTI | < 3.0s |
| Board with 200 visible cards | 60fps scroll, no jank |
| Heavy libs (charts, graph, gantt) | Always `next/dynamic` with `ssr: false`, never in main bundle |

Add a CI step (even now) that fails the build if a route's JS bundle exceeds budget — catching this at PR time is cheap; catching it after 1M users are on a slow bundle is not.

---

## 9. Mock Backend — Built Like a Real One

Route Handlers in `app/api/*` should simulate real-world constraints, not just return convenient data:

- Cursor pagination on every list endpoint (Section 5.1)
- Randomized latency (150–600ms)
- Occasional `429` and `500` responses (env-flag controlled) so error/retry UI is real, not theoretical
- Payload sizes representative of scale (seed 50,000+ issues across projects, not 80 — test your virtualization and pagination against real volume now)
- Response shape identical to what a real backend would return (`{ data, nextCursor, meta }`), so swapping the base URL later is the *only* change needed

---

## 10. Auth & Middleware at Scale

- Session validation happens in **Edge Middleware** (`middleware.ts`), not by hitting a database on every request — even in mock form, simulate this by validating a signed cookie/JWT at the edge, not calling `/api/me` on every navigation.
- Route groups: `(app)` requires auth, `(marketing)` doesn't — enforced in middleware via path matching, not per-page checks.

---

## 11. Observability From Day One

- Wrap the app in Sentry (or equivalent) now, even against the mock backend — catch client errors, failed mutations, slow queries in dev/staging before they're 1M-user incidents.
- Report Core Web Vitals (`useReportWebVitals`) to your analytics endpoint from the start, so you have a performance baseline before real traffic arrives, not after complaints start.

---

## 12. Build Order (revised for this architecture)

1. Turborepo scaffold: `apps/web`, `packages/types`, `packages/ui`, `packages/mock-db`
2. Mock backend first: seed 50,000+ realistic issues, build cursor-paginated Route Handlers with latency/error simulation
3. Auth shell + Edge Middleware (even with a fake user/session)
4. App shell: Server Component layout, route groups, navigation
5. Board + Backlog with virtualization + optimistic updates — this page proves your data/caching architecture actually holds up
6. Real-time: SSE Route Handler (Edge Runtime) + `useRealtimeUpdates` hook, wired into the Board so card moves reflect live — do this right after Board, since it's core UX, not an add-on
7. Issue Detail (Server + Client split)
8. Reports (lazy-loaded charts)
9. Automation, Dependency Graph, Weather Map, Decision Log (unique features)
10. Admin/Settings last

---

### Instruction block to paste to the AI agent along with this file:

> Build this as a Turborepo monorepo per Section 3. Default every component to a Server Component; only mark `"use client"` when interactivity requires it. Build the mock backend in Section 9 first, with 50,000+ seeded issues and cursor pagination — do not use small/convenient seed data, since the UI must be validated against realistic volume from the start. Every list view must be virtualized and paginated; never fetch or render an unbounded list. Follow the rendering strategy table in Section 4 exactly for each page. Ask before deviating.
