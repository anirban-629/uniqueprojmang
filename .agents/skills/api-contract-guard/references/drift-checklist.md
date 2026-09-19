# Drift Checklist — Beyond Field Names

Field-name and param-count mismatches are the ones nobody misses. This
checklist exists for the ones that compile fine, look fine in a quick review,
and break in production. Walk every category for the endpoint in question;
don't stop at the first pass.

## 1. Method and path

- Exact HTTP method (`PATCH` vs `PUT` are not interchangeable even when both
  "kind of work")
- Path parameter names and position match exactly, including trailing
  slash/no-trailing-slash consistency with the rest of the API
- Base URL / API version prefix matches what this route is actually mounted
  under, not an assumed convention

## 2. Params (path + query)

- Every required param is sent; every optional one is actually optional on
  both sides (FE shouldn't send `undefined` as a required param, BE shouldn't
  silently accept a missing "required" one)
- Type match, not just presence — a query param arrives on the wire as a
  **string**; if the BE schema coerces it to number/boolean, confirm the FE
  isn't already sending a pre-serialized value that double-encodes
  (`?ids=1,2,3` vs `?ids=1&ids=2&ids=3` — array query params are a frequent
  silent mismatch)
- Enum-valued params: FE only ever sends a value the BE schema actually
  accepts

## 3. Request body

- Every field's **optionality** matches — a field the BE marks required but
  the FE sometimes omits fails at request time, not compile time, unless the
  generated types are actually wired into the call site
- Every field's **nullability** — `undefined` (absent) and `null` (present,
  empty) are different on the wire and frequently handled inconsistently; if
  the BE schema allows `null`, the FE type must too, and the UI must have a
  path for it
- Nested object shapes match at every level, not just the top level — deeply
  nested optional fields are where hand-written types diverge from reality
  first
- Extra fields the FE sends that the BE schema doesn't declare — usually
  harmless if the BE strips unknowns, but check whether the BE schema is
  actually configured to strip vs silently accept vs reject (`additionalProperties`
  behavior) since inconsistency here hides bugs
- Array vs single-item shape matches exactly

## 4. Response handling

- The FE type reflects the response **as it arrives** — check for a
  serialization layer that changes shape (an envelope wrapper added by a
  reply hook, `snake_case` to `camelCase` transformation that's inconsistent
  between endpoints, a paginated wrapper on some list endpoints but not others)
- Success shape handled **per status code** the route can return (200 vs 201
  vs 204 — a 204 has no body; code that tries to parse JSON from it throws)
- **Every documented error status is handled**, not just caught generically.
  A 422 with field-level validation errors renders differently than a 401 that
  should redirect to login than a 429 that should show a retry message.
  Generic `catch` blocks that show one generic error message are themselves a
  finding.
- Fields the BE may omit vs explicitly `null` vs default to a value — confirm
  the FE's handling matches which one actually happens (log a real response
  if unsure, don't assume from the schema alone since defaults sometimes live
  in code not schema)

## 5. Types that don't survive JSON as-is

- **Dates**: BE `Date` objects serialize to ISO strings over JSON. If the FE
  type says `Date`, that's already wrong unless something explicitly
  deserializes it — confirm whether that happens and where.
- **Numbers**: large integers or money-as-decimal sometimes serialize as
  strings depending on the ORM/driver (common with `bigint`, `numeric`/
  `decimal` columns). Confirm what actually comes over the wire, not what the
  DB column type implies.
- **Enums**: the FE's union type must include every value the BE can actually
  emit, including values added since the FE type was last touched — diff the
  BE enum definition against the FE union directly, don't trust that they
  were ever kept in sync.
- **IDs**: string vs number consistently, especially at boundaries where one
  system uses UUID strings and another (or a URL param) stringifies them.

## 6. Casing and naming conventions

- Consistent `camelCase`/`snake_case` transformation applied uniformly across
  every field, including nested objects and array items — a global
  transform hook can miss a manually-constructed response in one handler
- If casing conversion happens via a shared utility, confirm this specific
  route's response actually passes through it (an endpoint added later,
  outside the standard controller pattern, is a common place for this to be
  skipped)

## 7. Pagination and collection shapes

- Consistent shape: is the list endpoint's response a bare array, or
  `{ data, meta }`, or `{ data, nextCursor }` — and does the FE client used
  for _this_ endpoint match, not just the pattern used elsewhere in the app
- Offset-based vs cursor-based — the request params differ entirely
  (`page`/`limit` vs `cursor`/`limit`) and mixing them produces silently wrong
  results, not an error
- Empty result: `[]` vs `{ data: [], meta: {...} }` vs (incorrectly) a `null`
  or missing `data` key — confirm the FE's empty-state handling matches what
  actually comes back, not what seems natural

## 8. Auth and headers

- Required headers the FE client actually sends match what the route
  requires (`Authorization`, tenant-context headers, `Content-Type` for the
  actual body encoding used — `multipart/form-data` vs `application/json`
  mismatches are common on upload endpoints)
- Auth failure (401) handled distinctly from authorization failure (403) —
  they usually need different FE responses (redirect to login vs show
  "not permitted")
- If the route requires a header that's environment-specific (a feature
  flag header, an API-version header), confirm it's set in every environment
  the FE runs in, not just local dev where a proxy might inject it silently

## 9. Idempotency and retry semantics

- If the FE retries failed requests (React Query, SWR, or manual retry
  logic), confirm the operation is actually safe to retry — a `POST` that
  creates a resource without an idempotency key will duplicate on retry
- Optimistic updates on the FE match what the BE actually guarantees — an
  optimistic update assuming success should have a correct rollback path for
  every error case in category 4, not just a generic one

## Recording findings

For each category, one of:

- **Pass** — verified against ground truth, cite how (compile check, direct
  read of both sides)
- **Finding** — file, line, what's wrong, what the correct shape is, and
  whether it's a production-breaking issue or a type-safety gap that hasn't
  bitten yet

Don't report "looks fine" without having actually checked — categories 4, 5,
and 7 are the ones most often skipped in a fast pass, and they're also the
ones most likely to be wrong.
