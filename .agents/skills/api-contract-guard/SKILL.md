---
name: api-contract-guard
description: Use whenever the user integrates, wires up, calls, consumes, or updates a frontend call to a backend API endpoint in a turborepo or any monorepo with separate FE/BE packages — "hook this component up to the X endpoint", "call the /users API from the frontend", "the BE changed this endpoint, update the FE", or any fetch/axios/react-query/SWR code talking to an internal backend. Also use for an explicit audit ask like "check if FE and BE are in sync" or "find API mismatches". Ensures the frontend's payload, params, headers, and response handling exactly match the backend route — including nullability, casing, dates, enums, error shapes, pagination, and auth, not just field names. Prefers a generated, type-safe client from the backend's OpenAPI spec over manual verification, falling back to a full manual cross-check plus a real compile check when generation isn't set up. Trigger proactively even without an explicit ask — silent FE/BE drift is the failure mode this exists to prevent.
---
# API Contract Guard

The point of this skill is that **a frontend/backend mismatch should be
impossible to miss, not just easy to review.** A human re-reading both sides
and nodding along is the weakest version of this. Every tier below is stronger
than that, and the skill's job is to get the repo to the strongest tier it can
reach, then actually run the check — not just claim compliance.

## The tiers, and which one to use

| Tier                              | Mechanism                                                                                                       | Drift is caught by                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **1 — Shared schema**      | A`packages/*` package exports Zod/Valibot schemas; BE validates requests with them, FE infers types from them | The build. No possible drift once wired.                                          |
| **2 — Generated client**   | BE emits an OpenAPI spec; a codegen step produces typed FE client + types from it                               | The build, one step removed — regenerate and`tsc` fails if the contract moved. |
| **3 — Manual cross-check** | No shared layer; read both sides, compare by hand                                                               | A careful pass through this skill's checklist. Weakest — depends on being run.   |

This repo already has an OpenAPI/Swagger spec, which means **Tier 2 is one
setup step away** and is the default target. Don't settle for Tier 3 when
Tier 2 is reachable — a manual check verifies today's integration; a generated
client keeps verifying every future one for free.

Use `references/tier-detection.md` to work out what's actually wired up before
assuming anything — repos drift, and a Swagger UI existing doesn't mean
anything consumes it yet.

---

## Workflow

### Step 1 — Identify what's being integrated or changed

Pin down concretely, before touching code:

- The exact backend route: method + path (e.g. `PATCH /api/tenants/:id/members/:memberId`)
- Whether this is a **new** integration or an **update** to an existing one
  (if update: what changed — new field, changed type, new status code, renamed
  param?)
- The FE call site(s) — component, hook, or API-client module. If it's new,
  where it *should* live given the repo's existing pattern.

If any of this is ambiguous (which endpoint, which FE surface), ask — this is
the one point where a wrong guess wastes the most downstream work. Everything
after this step should be concrete file paths, not descriptions.

### Step 2 — Establish ground truth on the backend

The backend route is the source of truth, always. Never infer the contract
from the frontend's existing (possibly already-wrong) code, and never infer it
from memory or a guess at REST convention.

Read, in this order:

1. The Fastify route definition and its schema (`schema: { params, querystring, body, response }`) — this is the *actual* validated contract, stronger
   evidence than the OpenAPI doc if the two ever disagree.
2. The controller/handler and service for what it actually does with each
   field — a schema can be looser than reality (e.g. marks something optional
   that's always populated).
3. The generated/served OpenAPI spec for this route, and diff it mentally
   against the Fastify schema. If they disagree, the Fastify schema wins and
   this is itself a bug worth flagging — someone's OpenAPI annotations drifted
   from the real validator.
4. Any DTO/type definitions the handler uses, for the exact TS shape.

Extract and write down explicitly:

- Every param (path, query) with its type and optionality
- The full request body shape, with every field's optionality and nullability
- The full response shape, **per status code** — success and every documented
  error
- Auth/header requirements
- Rate limit or other preconditions visible in the route config

This becomes the checklist Step 4 verifies against. Don't skip writing it down
even for a "simple" endpoint — most drift is in the fields nobody thought to
double check.

### Step 3 — Get (or build) the typed client

Check `references/tier-detection.md`'s output:

**If Tier 2 codegen already exists and covers this route:** regenerate the
client (`turbo run gen:api-types` or the repo's equivalent) so it reflects the
current backend, then use the generated types/client in the FE code. Do not
hand-write a type that already exists generated — that's reintroducing Tier 3
by hand.

**If Tier 2 doesn't exist yet:** this is the highest-leverage moment to set it
up, because the payoff compounds over every future integration, not just this
one. Follow `references/openapi-codegen-setup.md`. Budget for this — it's
normally a 20–40 minute setup, not a detour, and the user opted into "verify +
set this up properly" by describing what they want. If the user is clearly in
a hurry and just wants this one call working, do the manual check (Step 4) and
*separately* flag that codegen would prevent this class of bug going forward,
letting them decide.

**If the endpoint isn't covered by the OpenAPI spec at all** (missing
annotations, or the route predates the spec): fix that as part of this task —
add the schema-derived OpenAPI annotations for this route — since it's the gap
that caused Tier 2 to not apply here in the first place.

### Step 4 — Verify, exhaustively

Whether writing new FE code or checking existing code, walk
`references/drift-checklist.md` against the ground truth from Step 2. This is
the part that catches what a quick glance misses — optionality, casing, date
serialization, enum completeness, error-shape handling, pagination shape,
empty-vs-null, and method/path exactness. Don't skip categories because the
endpoint "looks simple" — simple endpoints are where nobody double-checks and
where drift survives longest.

For each item: pass, or a concrete finding (file, line, what's wrong, what it
should be).

### Step 5 — Prove it, don't just assert it

A claim of "types match" is worth nothing without a check that would fail if
it didn't. Run one of, in order of preference:

1. `tsc --noEmit` (or the repo's typecheck script) scoped to the affected FE
   package — if the generated/shared types are wired in correctly, a real
   mismatch is a compile error here. This is the actual proof.
2. If the endpoint has integration tests on either side, run them.
3. If neither is available, say so explicitly in the report rather than
   implying the check is stronger than it is.

If `tsc` fails, that's the finding — fix the FE usage or flag the BE contract
issue, then re-run until clean. A report that says "verified" while a
typecheck was failing is worse than not checking at all.

### Step 6 — Apply fixes or leave a clear report

- If asked to build/update the integration: write the FE code using the
  verified/generated types, handling every documented error status and every
  optional/nullable field explicitly (no silent `!` assertions past a nullable
  field — handle the null case).
- If asked to audit: use `references/report-template.md`. Lead with anything
  that would break in production (nullability, casing, missing error handling)
  before cosmetic mismatches (naming style, unused fields).
- Always end by stating **which tier the check ran at** for this endpoint, and
  if it's Tier 3, name the one setup step that would move it to Tier 2.

---

## Scope

This skill covers internal FE↔BE calls within the monorepo. It does not apply
to calls to genuinely external third-party APIs — those have their own
contracts you don't own and can't codegen from a spec you control.

Use this both when writing a **new** integration and when the backend
**changes** an existing endpoint — the second case is actually the more common
source of production bugs, since the FE code that was correct on day one
silently stops matching. Treat "I changed this backend route" as an implicit
trigger to check every FE call site that hits it, not just the one the user
mentioned.

## Reference files

- `references/tier-detection.md` — how to work out what's actually wired up
  before assuming a tier
- `references/openapi-codegen-setup.md` — wiring Tier 2 in a Fastify +
  turborepo setup when it doesn't exist yet
- `references/drift-checklist.md` — the exhaustive categories of mismatch to
  check, beyond field names
- `references/report-template.md` — output shape for audit-mode findings
