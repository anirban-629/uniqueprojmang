# Wiring Tier 2: Generated Client from OpenAPI (Fastify + Turborepo)

Goal: the backend's Fastify route schemas become the single source of truth;
the frontend gets generated TypeScript types (and ideally a typed fetch
wrapper) with zero hand-maintained duplication. Once this is wired, a contract
change becomes a `tsc` failure in the frontend the moment the spec regenerates
— that's what makes drift structurally hard instead of just reviewed-against.

This is the recommended path whenever the backend is Fastify + TypeScript and
an OpenAPI spec already exists or can be added cheaply — which is the case
here.

## Prerequisite: the spec must be derived from the real route schemas

If it isn't already:

```bash
# apps/api
npm install @fastify/swagger @fastify/swagger-ui
```

Register it once, near the other plugin registrations, so every route that
already declares a Fastify `schema` (params/querystring/body/response)
automatically appears in the spec — no separate annotation effort, and no
second source of truth to drift from the first:

```ts
import fastifySwagger from '@fastify/swagger';

await app.register(fastifySwagger, {
  openapi: {
    info: { title: 'API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
});
```

Every route lacking a `schema` block won't appear (or appears with no typed
contract) — treat "add the Fastify schema" as part of onboarding a route onto
this system, not an optional extra.

## Export the spec to a file the FE build can consume

Add a script that boots the app just enough to dump the spec, rather than
requiring a live server at build time (fragile in CI):

```ts
// apps/api/scripts/export-openapi.ts
import { buildApp } from '../src/app';

const app = await buildApp({ logger: false });
await app.ready();
const spec = app.swagger();
await app.close();

await Bun.write('openapi.json', JSON.stringify(spec, null, 2));
// or, without Bun: fs.writeFileSync('openapi.json', JSON.stringify(spec, null, 2));
```

```json
// apps/api/package.json
{
  "scripts": {
    "export-openapi": "tsx scripts/export-openapi.ts"
  }
}
```

## Generate types on the frontend side

`openapi-typescript` is the lean choice — types only, no runtime, pairs well
with a thin typed-fetch wrapper (`openapi-fetch`) so you're not pulling in a
heavy generated SDK:

```bash
# apps/web
npm install -D openapi-typescript
npm install openapi-fetch
```

```json
// apps/web/package.json
{
  "scripts": {
    "gen:api-types": "openapi-typescript ../api/openapi.json -o ./src/lib/api/schema.gen.ts"
  }
}
```

Typed client, one instance shared across the app:

```ts
// apps/web/src/lib/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './schema.gen';

export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });
```

Call sites get full inference, request *and* response, including which fields
are optional/nullable per the real Fastify schema, and which status codes are
documented:

```ts
const { data, error } = await api.PATCH('/api/tenants/{id}/members/{memberId}', {
  params: { path: { id: tenantId, memberId } },
  body: { role: 'admin' }, // shape enforced at compile time
});
if (error) {
  // error is typed per the response schema for non-2xx — handle it, don't ignore it
}
```

## Wire it into the turborepo pipeline

This is the step that decides whether this stays Tier 2 or quietly decays back
to Tier 3. Codegen that isn't in the task graph is a script nobody remembers
to run.

```json
// turbo.json
{
  "tasks": {
    "export-openapi": {
      "cache": false,
      "outputs": ["openapi.json"]
    },
    "gen:api-types": {
      "dependsOn": ["^export-openapi"],
      "inputs": ["../api/openapi.json"],
      "outputs": ["src/lib/api/schema.gen.ts"]
    },
    "dev": {
      "dependsOn": ["gen:api-types"],
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["gen:api-types", "^build"]
    }
  }
}
```

With this in place: `turbo dev` and `turbo build` regenerate types before
running, so a backend contract change surfaces as a frontend type error at the
next build — nobody has to remember a manual step, and CI catches it even if a
local dev's watcher missed it.

## Commit or gitignore the generated file?

Either is defensible; be consistent and state the choice:

- **Gitignore it** (cleaner, but CI must run `gen:api-types` before typecheck,
  and reviewers can't see the diff on the type changes themselves)
- **Commit it** (reviewers see exactly what contract changed in the PR diff,
  at the cost of a generated file in version control)

Committing is usually the better default for a team that wants contract
changes visible in code review, which is normally the point of doing this at
all.

## Sanity check after wiring

Confirm the loop actually closes — this is the test that the setup is real,
not just present:

1. Change a Fastify route's response schema (e.g. make a field nullable).
2. Run `turbo run export-openapi gen:api-types`.
3. Confirm the generated `schema.gen.ts` changed.
4. Confirm any FE code that assumed the old (non-nullable) shape now fails
   `tsc --noEmit`.

If step 4 doesn't fail, something in the chain isn't actually wired — find and
fix that before treating this endpoint as Tier 2.
