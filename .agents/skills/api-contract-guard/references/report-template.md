# Audit Report Template

Used when the skill runs in audit mode ("check FE/BE sync") rather than while
building a specific integration. Lead with what would actually break
production; put naming/cosmetic mismatches last so they don't dilute the
findings that matter.

````markdown
# API Contract Audit — <scope: repo-wide | app/web/src/features/X>

**Tier at time of audit:** <1 | 2 | 3, per endpoint if mixed>
**Verification method:** <tsc --noEmit on apps/web | manual cross-check | tests>
**Endpoints checked:** <count>

## Production-breaking findings

For each: severity-first, one entry per issue, not one entry per endpoint.

### `<METHOD> <path>` — <one-line description of the bug>
- **File:** `path/to/file.ts:line`
- **What's wrong:** <concrete — e.g. "FE treats `deletedAt` as always present;
  BE schema marks it nullable and it's `null` on 90% of records">
- **Why it breaks:** <concrete failure — crash, silent wrong behavior, data
  loss>
- **Fix:** <specific — code change or contract change>

## Type-safety gaps (not yet broken, but unverified)

Same shape as above — things that happen to work today because of data
patterns in current test data, but aren't actually guaranteed by the contract.

## Missing error handling

List endpoints where a documented BE error status has no FE handling, or falls
through to a generic catch-all that doesn't tell the user anything actionable.

## Cosmetic / consistency

Casing inconsistencies, naming drift, unused response fields — real but low
urgency.

## Tier recommendation

State the current tier per problem area and the single next step that would
move it up, e.g.:

> `apps/web/src/features/billing` is at Tier 3 — 6 hand-written interfaces
> duplicating BE DTOs, 2 of which are already stale. `apps/api` already emits
> an OpenAPI spec covering this area. Wiring `gen:api-types` (see
> `openapi-codegen-setup.md`) would eliminate this entire class of finding for
> billing going forward, not just fix today's instances.

## Summary

One paragraph: how many endpoints checked, how many findings by severity, and
the single highest-leverage next action (usually: wire codegen for the area
with the most manual duplication, since it prevents recurrence rather than
just fixing today's instances).
````

## Notes on tone

State findings as facts with evidence (file, line, the actual schema vs the
actual FE type), not as hedged possibilities. "This may be an issue" is weaker
and less actionable than "the BE schema marks `email` nullable at
`auth.schema.ts:42`; the FE type at `useUser.ts:18` doesn't, and line 25
accesses `.toLowerCase()` on it unguarded." Specificity is what makes an audit
report something someone can act on the same day instead of re-deriving it
themselves.
