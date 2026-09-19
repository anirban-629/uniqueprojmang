# Tier Detection — What's Actually Wired Up

Never assume the tier from a single signal (like "Swagger UI is running").
Verify with commands, not with a glance at the README. Repos drift from what
was once set up.

## Checks to run, roughly in order

**1. Is there a shared contracts/types package? (Tier 1 signal)**

```bash
ls packages/ 2>/dev/null
grep -rl "zod\|valibot\|typebox" packages/*/package.json 2>/dev/null
```

If a `packages/contracts` (or similarly named) package exports Zod schemas
that the Fastify routes import for `schema:` and that the frontend imports for
types — that's Tier 1, already the strongest tier. Confirm both sides actually
import it (`grep -r "from '@repo/contracts'"` or the workspace's actual
package name across both `apps/api` and `apps/web`) rather than assuming
because the package exists that it's used everywhere.

**2. Is there an OpenAPI spec, and is it actually served/exported? (Tier 2 prerequisite)**

```bash
grep -rl "@fastify/swagger" apps/api/**/*.ts 2>/dev/null
find . -iname "openapi*.json" -o -iname "swagger*.json" 2>/dev/null
```

Check whether the spec is:

- Generated from the Fastify route schemas (good — one source of truth) vs.
  hand-written/hand-annotated separately (risk — it can drift from the real
  validator; treat the route schema as ground truth if so, per SKILL.md Step 2)
- Exported to a file/endpoint that a codegen step could consume, or only
  visible via the interactive Swagger UI (which nothing can codegen from
  automatically)

**3. Is there a codegen step already producing FE types/client? (Tier 2 signal)**

```bash
grep -l "openapi-typescript\|orval\|swagger-typescript-api\|openapi-fetch\|openapi-generator" \
  apps/web/package.json package.json turbo.json 2>/dev/null
cat turbo.json | grep -A3 "gen:api\|codegen\|generate"
find . -path "*/node_modules" -prune -o -iname "*.generated.ts" -print 2>/dev/null
```

If found: confirm it actually runs as part of the pipeline (a `turbo.json`
task, a `predev`/`prebuild` script) rather than existing as a script nobody
calls. A codegen script that isn't wired into `turbo dev`/`turbo build`/CI is
effectively Tier 3 with extra steps — it only helps if someone remembers to
run it.

**4. Does the frontend actually import the generated types where API calls
happen?**

```bash
grep -rl "from.*generated\|from.*api-types\|from.*openapi" apps/web/src 2>/dev/null
```

If codegen exists but the actual `fetch`/`axios`/`react-query` call sites use
hand-written interfaces instead of the generated ones, that's the gap to close
— wiring existing codegen into actual usage is far cheaper than setting up
codegen from scratch, so prioritize it.

## Recording the result

State plainly, before proceeding to Step 2 of the main workflow:

```
Tier for this endpoint: <1 | 2 | 3>
Evidence: <what you found>
Gap to next tier up: <the specific missing piece, or "none — already at Tier 1">
```

If different endpoints in the same repo are at different tiers (common in a
mid-migration repo), say so — don't average it into one repo-wide claim.
