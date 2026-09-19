# Flowline Automation & E2E Testing Plan

This document outlines the phased automation testing strategy for the Flowline monorepo (Fastify API + Next.js App Router).

---

## 1. Test Architecture & Tooling

| Test Level | Tool | Target Scope | Execution Context |
| :--- | :--- | :--- | :--- |
| **Unit & Integration** | **Vitest** | `apps/api` Services, Repositories, Fastify Route Handlers, Crypto Utils | In-memory + Local/Remote PostgreSQL |
| **Component & Hooks** | **Vitest + React Testing Library** | `@flowline/ui`, `@flowline/hooks`, `apps/web/components` | JSDOM |
| **End-to-End (E2E)** | **Playwright** | `apps/web` Full User Journeys across browser engines | Real running dev server (`localhost:3000` + `localhost:4000`) |

---

## 2. Phase A: Backend Integration & Route Test Suite (`apps/api`)

### Setup
- Install Vitest in `apps/api`: `npm install -D vitest @types/node`
- Add `"test": "vitest run"` in `apps/api/package.json`.

### Coverage Matrix
1. **Authentication (`tests/auth.test.ts`)**:
   - `POST /api/auth/register` (happy path, duplicate email, weak password).
   - `POST /api/auth/login` (valid credentials, invalid password, suspended user).
   - `GET /api/auth/me` (with valid JWT cookie vs missing cookie).
   - `POST /api/auth/refresh` (token rotation, reuse detection).
   - `POST /api/auth/switch-tenant` (valid membership vs unauthorized tenant).
2. **Projects & Issues (`tests/core.test.ts`)**:
   - `POST /api/projects` (creates project, generates key prefix, binds owner).
   - `GET /api/projects/:id` (retrieves project details).
   - `POST /api/issues` (auto-generates sequential key e.g. `PROJ-1`, persists status).
   - `PATCH /api/issues/:id` (status transition, assignee change, priority update).
   - `POST /api/comments` (posts comment, validates parent issue existence).
3. **Multi-Tenant Security (`tests/isolation.test.ts`)**:
   - Cross-tenant queries: Tenant A user attempting to read/update Tenant B project or issue must receive `403 Forbidden` or `404 Not Found`.

---

## 3. Phase B: Frontend Component & Hook Tests (`apps/web`)

### Setup
- Install Vitest + React Testing Library in `apps/web`.

### Coverage Matrix
1. `LoginForm` & `RegisterForm` validation states, error toasts, submit loading indicators.
2. `KanbanBoard` column rendering, card virtualization, drag-and-drop state optimistic updates.
3. `useAuth` hook session persistence, cookie synchronization, and tenant switching.

---

## 4. Phase C: Playwright End-to-End User Journeys (`e2e/`)

### Key Scenarios
1. **Scenario 1: Complete Workspace Onboarding**:
   - Sign up with new organization (`Acme Labs`).
   - Land on dashboard, open "Create Project" modal.
   - Create project "Platform Core" with key `CORE`.
   - Verify redirected to `/projects/CORE/board`.
2. **Scenario 2: Jira-Style Issue Workflow**:
   - Click "Create Issue", type summary "Implement OAuth2 provider", select priority "High".
   - Verify ticket appears under `Todo` column as `CORE-1`.
   - Drag `CORE-1` from `Todo` to `In Progress`.
   - Click `CORE-1` to open detail modal, post comment "Working on token hashing", verify comment persists.
   - Drag `CORE-1` to `Done`.
3. **Scenario 3: Team Collaboration & Invitation**:
   - Navigate to `/settings/members`, invite `developer@acmelabs.com` as member.
   - Open invite URL in incognito context, accept invite.
   - Verify invited user sees `Platform Core` board and can view `CORE-1`.
