
---
name: module-docs
description: >-
  Generates clear, technical, AI-readable documentation for a single backend module (e.g. auth,
  core, automation, realtime, ai, search, integrations, analytics). Requires the user to name the
  module; asks for clarification if the name is ambiguous or doesn't match an existing module.
  Writes to apps/api/src/modules/<module-name>/README.md — directly inside the same folder as
  the module's implementation files (full overwrite each run) — and keeps a separate,
  centralized master index at docs/modules/README.md.
---
# Module Documentation Generator

Use this skill when asked to *"document the <module></module> module"*, *"generate docs for <module></module>"*, *"write documentation for <module></module>"*, or similar. This skill documents **one module per run** — it does not run against the whole codebase at once.

---

## Step 1: Identify the Target Module (mandatory — never guess)

1. The user must name a module. If they didn't (e.g., just said "run the docs skill"), ask which module before doing anything else.
2. Match the named module against the actual folders under `apps/api/src/modules/`. Do not rely on memory of what modules exist — list the directory fresh each run, since modules get added over time:
   ```bash
   ls apps/api/src/modules/
   ```
3. **Disambiguation rules:**
   - **Exact match** (e.g., user said "auth", folder `auth/` exists) → proceed directly.
   - **No match at all** (e.g., user said "payments" and no such folder exists) → list the actual available modules and ask the user to pick one. Do not invent documentation for a module that doesn't exist.
   - **Ambiguous/partial match** (e.g., user said "auto" and both `auth/` and `automation/` could plausibly be meant) → list the close matches and ask which one they meant. Never pick one silently.
   - **Multiple modules requested in one message** (e.g., "document auth and core") → confirm whether they want this run once per module in sequence (this skill's normal one-at-a-time flow, repeated) or treat it as out of scope for a single invocation — ask rather than assuming.

## Step 2: Read the Module's Actual Code (don't infer from the name alone)

Before writing anything, read every file present in the module's folder — this documentation must reflect what the code actually does, not a generic template filled with guesses. At minimum, check for and read:

- `<module>.routes.ts` — actual HTTP endpoints, methods, paths
- `<module>.controller.ts` — request/response shapes actually handled
- `<module>.service.ts` — the real business logic and orchestration
- `<module>.repository.ts` — actual data access, tables/entities touched
- `<module>.events.ts` — events actually published/subscribed, with real payload shapes
- `<module>.schema.ts` — actual validation rules (required fields, constraints)
- `<module>.types.ts` — actual DTOs and domain types
- `<module>.state.ts` (if present) — actual in-memory state structures and their lifecycle
- Any other file present in the folder not covered above

If a section below has nothing to report for this module (e.g., no events published), say so explicitly ("This module does not publish any domain events") rather than omitting the section silently — an absent section is ambiguous between "not documented" and "genuinely not applicable."

## Step 3: Generate the Documentation

Use this structure, in this order, every time — consistency across modules matters since another AI (or you, later) will read many of these back-to-back:

```markdown
# <Module Name> Module

## Purpose
<1-3 sentences: what domain responsibility this module owns, in plain terms.>

## Public Interface
<What other modules or the outside world can call. List the actual HTTP endpoints:>

| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | /api/... | ... | Yes/No |

## Request/Response Contracts
<Key DTOs from <module>.types.ts, with field names and types. Not every internal type — just what matters to a caller.>

## Business Logic Summary
<What <module>.service.ts actually does, in plain technical language. Cover the main functions/flows, not a line-by-line narration. Note any non-obvious rules, validations, or edge cases handled.>

## Data Model
<Tables/entities this module reads or writes, from <module>.repository.ts. Note if it's mockDb (in-memory/dev) or real Postgres, and which columns/fields matter.>

## Domain Events
### Published
<Event name, payload shape, when it fires. "None" if not applicable.>

### Subscribed
<Event name, source module (if known), what this module does in response. "None" if not applicable.>

## In-Memory State (if applicable)
<Any state held in <module>.state.ts — what it stores, TTL/eviction behavior, whether it survives a restart. Omit this section entirely if the module holds no in-memory state.>

## Dependencies
<Other modules this one calls into directly (via their service.ts interface), and external services (Redis, Supabase, third-party APIs) it talks to.>

## Error Handling
<Custom errors this module throws (from shared/errors), and what HTTP status they map to.>

## Known Limitations / TODOs
<Anything visibly incomplete, mocked, or flagged in code comments as temporary. "None noted" if nothing found — don't fabricate limitations that aren't evidenced in the code.>

## Configuration
<Any env vars specific to this module's behavior, if applicable. "None" otherwise.>
```

Write in **plain, precise technical language** — short sentences, no marketing tone, no filler ("this powerful module..."). Assume the reader is a competent engineer or another AI agent who has never seen this codebase and needs to understand the mechanism, not be sold on it.

## Step 4: Confirm Before Writing (per project guardrails)

This is a full-overwrite operation by design (per project convention: every run replaces the file entirely, not a merge). Because of that:

1. **If `apps/api/src/modules/<module-name>/README.md` already exists**, say so explicitly and note that proceeding will fully replace it: *"This will overwrite the existing README.md for `<module>` — any manual edits in the current version will be lost. Proceed?"*
2. **If it doesn't exist yet**, note that a new file will be created and briefly summarize what will be in it, then ask: *"Should I go ahead and create `apps/api/src/modules/<module-name>/README.md` with this content?"*
3. Wait for explicit confirmation either way before writing. This follows the project's standing rule that every file write requires permission, regardless of size or perceived safety.

## Step 5: Write the File

Only after confirmation, write directly into the module's own implementation folder — the same directory as `<module>.routes.ts`, `<module>.service.ts`, etc.:

```
apps/api/src/modules/<module-name>/README.md
```

Overwrite in full with the generated content.

## Step 6: Update the Master Index

After the module doc is written, update (or create) `docs/modules/README.md` — a single table listing every documented module:

```markdown
# Module Documentation Index

| Module | Description | Last Updated |
|---|---|---|
| auth | User identity, tenant membership, JWT session management | <date> |
| core | Projects, issues, sprints, comments, decisions | <date> |
```

- If the index file doesn't exist yet, create it with just this module's row.
- If it exists, update only the row for the module just documented (add if new, replace if existing) — leave every other module's row untouched.
- This is also a file write and follows the same confirmation rule as Step 4, but since it's a small, mechanical update, it's fine to fold this into the same confirmation ask from Step 4 rather than asking twice (e.g., *"...and I'll also update the module index at docs/modules/README.md to reflect this. Proceed?"*).

## Step 7: Report

After writing, confirm what was done and where, e.g.: *"Documented the `auth` module at `apps/api/src/modules/auth/README.md`, and updated the centralized index at `docs/modules/README.md`."*
