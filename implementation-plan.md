# Objective

Take this application from its current state to fully operational — usable by
a real person end-to-end the way someone uses Jira: log in, set up their
workspace, create and manage work items, move them through a workflow,
collaborate on them, and trust that every action actually does what it claims.
Nothing simulated, nothing partially wired, nothing that only works if you
don't look too closely.

Do not assume you know the current state of this project. Discover it first.
Do not stop at "the code compiles" — the definition of done is a real user
journey completing successfully, proven by an automated test that exercises it.

# Before you start

Read these two files in full and follow their methodology for the relevant
parts of this task — treat them as required process, not optional reference:

- `.agents/skills/implementation-planner/SKILL.md` (and its `references/`)
  — for how to audit, plan, and sequence the work
- `.agents/skills/api-contract-guard/SKILL.md` (and its `references/`)
  — for verifying every frontend call against the real backend contract

# Phase 0 — Honest audit (before writing or fixing anything)

1. Map the actual structure: every app/package in the repo, what each one is
   responsible for, and how they depend on each other.
2. Backend: list every route that exists, and for each, whether it has real
   validation and a real handler, or is a stub/placeholder/TODO/mocked
   response.
3. Frontend: list every screen and flow, and for each, whether it calls a
   real backend endpoint, a mocked one, or hardcoded data.
4. Identify every place the frontend and backend currently disagree (missing
   fields, wrong types, unhandled error responses) using the
   `api-contract-guard` methodology.
5. Identify what currently has zero test coverage.
6. Produce a written gap list: what a user can actually do today vs. what a
   working project-management tool needs to let them do — workspace/org
   setup, authentication, creating a project, creating and editing work items,
   assigning them, moving them through status transitions, commenting,
   attachments if applicable, search/filter, notifications if applicable.

Show me this gap list before proceeding to Phase 1.

# Phase 1 — Plan the work

Using the gap list, produce a sequenced implementation plan (per the
implementation-planner methodology): what gets built or fixed, in what order,
with each phase leaving the app in a working, deployable state. Flag the
riskiest or most uncertain part explicitly. Show me this plan before writing
code.

# Phase 2 — Build and fix, one vertical slice at a time

For each item in the plan:

- Implement or fix the backend route with real, validated logic — no
  placeholder responses, no "implement later," no hardcoded data pretending
  to be real.
- Implement or fix the frontend to call the real endpoint, following the
  api-contract-guard checklist: correct params/payload, correct handling of
  every response status (not just the happy path), correct handling of
  optional/nullable fields, correct empty/loading/error states.
- After each slice, run the backend's schema check and the frontend's
  typecheck (`tsc --noEmit` or equivalent) — must pass before moving on.
- Keep each slice small, reviewable, and revertible — don't batch unrelated
  fixes into one giant change.

# Phase 3 — Test thoroughly, at every level

- **Unit tests** for business logic (services, utilities, validation rules).
- **Integration tests** for each backend route — happy path, every
  documented error case, and at least one adversarial input (missing field,
  wrong type, unauthorized caller, cross-tenant/cross-user access attempt
  if applicable).
- **End-to-end tests** simulating a real person's full journey: sign up or
  log in → create the core entity (e.g. a project) → create a work item →
  edit it → change its status → assign it → comment on it → verify it shows
  correctly in the relevant list/board view → verify a second user without
  permission cannot see or modify it. Chain these into full lifecycle
  journeys rather than one test per button.
- Run the full test suite after every phase, not just at the end, so a
  failure is caught next to the change that caused it.

# Phase 4 — Final verification and report

Give me a report containing:

1. Every user-facing flow that now works end-to-end, with the test that
   proves it.
2. Anything found broken or stubbed, and what was done to fix it.
3. Any frontend/backend contract mismatches found and how they were
   resolved (note whether the endpoint is now Tier 1/2/3 per
   api-contract-guard).
4. Full test suite results — what passes, and honestly, anything that still
   doesn't and why.
5. Anything deliberately left out of scope, and why.

# Constraints

- Never mark something "working" without a passing automated test proving
  it — not a description of what it should do.
- Never leave a mocked or hardcoded response in a code path you touch, even
  if it's not the specific thing you were asked to fix — flag it in the
  report if deliberately deferred, never leave it silently.
- If something turns out to be a bigger architectural change than expected
  (e.g. auth needs rework before workflows can function), stop and tell me
  rather than quietly scoping it down.
- Work in small, reviewable increments — five small phases beats one
  enormous one.

Start with Phase 0 now and show me the audit before doing anything else.
