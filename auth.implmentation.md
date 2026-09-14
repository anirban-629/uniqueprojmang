
# Auth Service & Multi-Tenant Identity — Secured Implementation Plan

Aligned with the existing `apps/api/src/modules/auth` structure and the 5-tier
architecture (`routes → controller → service → repository → events`).

This document extends your original plan with a security-first lens: what to
lock down, what defaults to choose, and in what order to build it so nothing
ships half-secured.

---

## 1. Decision First: Which Auth Mode?

Your plan leaves this as an open question. Pick **one** before writing code —
don't build both paths in parallel, it doubles your attack surface.

|                   | Option A: Direct JWT (Fastify + PG)   | Option B: Supabase Auth                                                                                       |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Password storage  | You own it — must get Argon2id right | Delegated — Supabase owns it                                                                                 |
| MFA/social login  | You build it                          | Comes mostly free                                                                                             |
| Token revocation  | You must build a revocation list      | Supabase handles rotation, but you still need tenant-claim sync                                               |
| Offline/self-host | ✅ Works anywhere                     | ❌ Needs Supabase project                                                                                     |
| Effort            | Higher (you own the crypto)           | Lower, but you must**still verify JWTs server-side and never trust client-supplied tenant/role claims** |

**Recommendation:** Go with **Option A (Direct JWT)** since your plan already
assumes full control over `auth.repository.ts` and RLS — owning the whole
chain is more secure than a hybrid, because hybrids are where sync bugs and
trust-boundary mistakes creep in (e.g. trusting a Supabase JWT's `role` claim
without re-checking it against your `tenant_members` table). If you later
want social login, add it as an *additional* strategy behind the same
`auth.service.ts`, not a replacement.

---

## 2. Password Security

- **Hash algorithm:** Argon2id (not bcrypt if you can help it — Argon2id is
  resistant to both GPU and side-channel attacks). Use `argon2` npm package,
  not `bcryptjs`, as your primary. Config:
  - `memoryCost`: 19456 (≈19 MB), `timeCost`: 2, `parallelism`: 1 — tune with
    a benchmark on your actual prod hardware, target ~250–500ms per hash.
  - Fallback to `bcryptjs` only if Argon2 native bindings are unavailable in
    your deploy target — flag this clearly in `env.config.ts`, don't silently
    downgrade.
- **Never** store or log plaintext passwords, even in dev fallback mode.
- **Pepper:** add a server-side secret (`PASSWORD_PEPPER` env var) HMAC'd into
  the password before hashing. This means a stolen DB dump alone still isn't
  crackable without the app's secret.
- **Password policy:** minimum 10 chars, no arbitrary "must contain symbol"
  rules (NIST 800-63B advises against composition rules — they push users to
  predictable patterns). Instead: check against a breached-password list
  (e.g. local k-anonymity check against the HaveIBeenPwned range API) at
  registration and password-change time.
- **Timing safety:** `login()` must take the same code path (and roughly same
  time) whether the email exists or not. Always run the hash comparison even
  on "user not found" using a dummy hash, to prevent user-enumeration via
  timing.

---

## 3. JWT & Session Design

Your plan mentions `JwtPayload` with `sub`, `tenant_id`, `company_id`, `role`,
`email`. Harden it:

- **Algorithm:** RS256 (asymmetric), not HS256, once you have more than one
  service verifying tokens. HS256 is fine only while a single Fastify process
  is both signer and verifier. Store the private key in a secrets manager,
  never in `.env` committed to git.
- **Claims to add:**
  - `jti` (unique token ID) — required for revocation (see below).
  - `iat`, `exp`, `nbf`.
  - `iss`, `aud` — verify both on every request, not just signature.
  - Do **not** put `role` alone in the access token as the sole authority for
    admin actions — always re-check role/tenant membership against the DB for
    sensitive operations (invite, delete tenant, billing). Tokens are cached
    trust; DB is source of truth.
- **Access token TTL:** short — 10–15 minutes.
- **Refresh token TTL:** 7–30 days, but **rotate on every use** (rotating
  refresh tokens): each refresh call invalidates the old refresh token and
  issues a new one. If an old (already-used) refresh token is presented
  again, treat it as a **theft signal** — revoke the entire token family for
  that user/session immediately and force re-login.
- **Refresh token storage:** store only a **hash** of the refresh token
  (SHA-256) in Redis/Postgres, never the raw token — same principle as
  passwords. Key by `jti`, value = `{ userId, tenantId, familyId, expiresAt }`.
- **Revocation list:** maintain a small Redis set of revoked `jti`s (with TTL
  matching the token's remaining life) so you can invalidate access tokens
  immediately on logout, password change, or suspected compromise — otherwise
  a short-lived JWT model has no way to kill a live session early.
- **Token binding to tenant switch:** `switchTenant()` must re-verify the
  caller is an active, non-revoked member of `targetTenantId` (query DB, not
  the old token's claims) before minting a new token.

---

## 4. Multi-Tenancy & RLS (Postgres)

- Every table with tenant-scoped data must have RLS enabled and a policy like:
  ```sql
  CREATE POLICY tenant_isolation ON <table>
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
  ```
- **Set `app.current_tenant_id` per-request**, inside the same transaction/
  connection that runs the query — not globally on the pool. Use a scoped
  `SET LOCAL` inside a transaction wrapper in `tenancy.plugin.ts` so it can
  never leak across requests sharing a pooled connection.
- Never let the client-supplied `tenantId` in a request body/header set this
  directly — always derive it from the **verified JWT claim**, and for
  `switch-tenant`, from a freshly re-checked DB membership row.
- Add a `role` enum check at both the RLS level (if using `pgcrypto`/row
  policies for role-gated tables) and at the service layer — defense in
  depth, don't rely on RLS alone for authorization logic beyond isolation.
- Write a **negative test**: user A from tenant 1 must get 0 rows (not an
  error — 0 rows) when querying tenant 2's data even with a crafted request.

---

## 5. Transport & Network Security

- Enforce HTTPS everywhere; add `Strict-Transport-Security` header.
- Use `@fastify/helmet` for security headers (CSP, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy).
- **CORS:** explicit allow-list of origins from `env.config.ts`, never `*`
  when credentials/cookies are involved.
- **Token transport:** prefer `httpOnly`, `Secure`, `SameSite=Strict` (or
  `Lax` if you need cross-site GET navigation) cookies for the refresh token,
  and keep the access token in memory on the client (not localStorage) to
  reduce XSS token theft. If you must support pure bearer-token API clients
  (mobile, third-party), keep that as a separate flow with tighter scopes.
- If cookies are used for auth, add **CSRF protection** (double-submit token
  or `@fastify/csrf-protection`) on state-changing routes.

---

## 6. Rate Limiting & Abuse Prevention

- `@fastify/rate-limit` on:
  - `/api/auth/login` — e.g. 5 attempts / 15 min per IP **and** per email,
    with exponential backoff.
  - `/api/auth/register` — throttle to prevent mass account creation.
  - `/api/auth/refresh` — throttle to slow down token-family abuse attempts.
  - `/api/auth/invite` — throttle per tenant to prevent invite-spam.
- **Account lockout / soft-lock:** after N failed logins, add increasing
  delay or a temporary lock with notification email — avoid hard-lockout
  that itself becomes a DoS vector against a specific user.
- Log and alert on anomalous patterns (many failed logins across many emails
  from one IP = credential stuffing signal).

---

## 7. Input Validation & Error Handling

- Every route already gets a Fastify JSON schema per your plan — keep this
  **strict** (`additionalProperties: false`) so unexpected fields are
  rejected, not silently ignored.
- Validate email format + normalize (lowercase, trim) before lookups to
  prevent duplicate-account edge cases (`Foo@x.com` vs `foo@x.com`).
- **Never leak which part failed.** `login()` returns a generic `401 Invalid email or password` for both "no such user" and "wrong password" —
  never a distinguishable error. Same idea for password-reset: always say
  "if that email exists, a reset link was sent."
- Centralize error shapes so stack traces / DB errors never reach the client
  in production (`NODE_ENV` gated).

---

## 8. Missing Pieces to Add to Your Plan

Your original plan doesn't mention these — they're essential for a
"production-grade" auth service:

1. **Email verification flow** — `auth:user_registered` event should trigger
   a verification email; unverified accounts should have restricted access
   until confirmed (or at least be flagged).
2. **Password reset flow** — `POST /api/auth/forgot-password` and
   `POST /api/auth/reset-password` with a single-use, short-TTL (15 min)
   signed token, invalidated after use and on any successful login.
3. **MFA (TOTP)** — even a v1 optional TOTP (via `otplib`) for owner/admin
   roles substantially raises the bar; plan the DB column (`mfa_secret`,
   encrypted at rest) now even if you ship it in phase 2.
4. **Audit log table** — `auth_audit_log(user_id, tenant_id, action, ip, user_agent, created_at)` — record login, failed login, password change,
   role change, invite sent/accepted, tenant switch. This is often a
   compliance requirement (SOC2) and invaluable for incident response.
5. **Session/device listing + revoke** — `GET /api/auth/sessions` and
   `DELETE /api/auth/sessions/:id` so users can see and kill active refresh
   token families (e.g. "log out of all devices").
6. **Invite token security** — invite tokens should be single-use, expiring,
   and bound to the invited email (reject accept-invite from a different
   email address than invited).
7. **Secrets management** — `JWT_SECRET`/private key, `PASSWORD_PEPPER`,
   DB creds should come from a secrets manager (Vault/AWS Secrets
   Manager/Doppler) in prod, not plain `.env`. At minimum, validate at boot
   that required secrets are set and meet a minimum entropy/length, and fail
   fast instead of booting insecurely.
8. **Dependency & secret scanning in CI** — `npm audit`/`osv-scanner` and a
   secret-scanner (gitleaks) as CI gates before this module merges.

---

## 9. Updated `env.config.ts` Additions

```
JWT_PRIVATE_KEY / JWT_PUBLIC_KEY   # RS256 keypair (or JWT_SECRET for HS256 dev-only)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
PASSWORD_PEPPER=<32+ byte random>
ARGON2_MEMORY_COST=19456
ARGON2_TIME_COST=2
REDIS_URL=                         # refresh-token store + revocation list + rate limiting
EMAIL_VERIFICATION_TOKEN_TTL=24h
PASSWORD_RESET_TOKEN_TTL=15m
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW=15m
CORS_ALLOWED_ORIGINS=
```

---

## 10. Revised Endpoint Set

Building on your plan's routes, with additions in **bold**:

| Method           | Route                                   | Notes                                                      |
| ---------------- | --------------------------------------- | ---------------------------------------------------------- |
| POST             | `/api/auth/register`                  | rate-limited, triggers email verification                  |
| POST             | `/api/auth/login`                     | rate-limited, generic errors, emits`auth:user_logged_in` |
| POST             | `/api/auth/refresh`                   | rotates token, detects reuse                               |
| POST             | `/api/auth/logout`                    | revokes current`jti` + refresh token                     |
| **POST**   | **`/api/auth/logout-all`**      | revokes all sessions/token families for user               |
| POST             | `/api/auth/switch-tenant`             | re-checks DB membership, mints new token                   |
| POST             | `/api/auth/invite`                    | owner/admin only, single-use expiring token                |
| POST             | `/api/auth/accept-invite`             | validates email match + expiry                             |
| **GET**    | **`/api/auth/verify-email`**    | consumes verification token                                |
| **POST**   | **`/api/auth/forgot-password`** | always generic response                                    |
| **POST**   | **`/api/auth/reset-password`**  | single-use token, invalidates sessions                     |
| **GET**    | **`/api/auth/sessions`**        | list active refresh-token families                         |
| **DELETE** | **`/api/auth/sessions/:id`**    | revoke one session                                         |
| GET              | `/api/auth/me`                        | profile + tenant context                                   |
| GET              | `/api/auth/tenants`                   | list memberships                                           |

---

## 11. Suggested Build Order (Phased)

1. **Phase 0 — Foundations:** `env.config.ts` secrets, Argon2 + pepper
   utility, RS256 keypair generation/rotation plan, Redis connection.
2. **Phase 1 — Core auth:** register, login, refresh (with rotation +
   reuse detection), logout, `auth.repository.ts` DB queries, RLS policies
   live and tested.
3. **Phase 2 — Multi-tenant:** switch-tenant, invite/accept-invite, role
   checks at service layer, `auth.events.ts` wired to `eventBus`.
4. **Phase 3 — Account lifecycle:** email verification, password reset,
   audit log table + writes on every sensitive action.
5. **Phase 4 — Hardening:** rate limiting, helmet/CORS, session listing +
   revoke-all, MFA scaffolding.
6. **Phase 5 — Verification:** automated tests (below) + manual Swagger
   pass + a focused pentest checklist before go-live.

---

## 12. Verification Plan (Expanded)

### Automated tests (add to your existing list)

- Refresh-token reuse triggers full family revocation.
- Expired/blacklisted `jti` is rejected even with a valid signature.
- Cross-tenant data access returns 0 rows, not an error, under RLS.
- Login timing is statistically similar for existing vs non-existing emails.
- Password reset token is single-use (second use fails).
- Invite acceptance fails if the accepting email ≠ invited email.
- Rate limiter actually blocks the 6th login attempt in the window.

### Manual / security checklist before launch

- [ ] No secrets committed to git; `.env.example` has placeholders only.
- [ ] `npm audit` / `osv-scanner` clean or triaged.
- [ ] Helmet + CORS allow-list verified against actual frontend origin(s).
- [ ] JWT `alg` confusion attack tested (reject tokens signed with `none` or
  wrong algorithm).
- [ ] Confirm RLS is **enabled and enforced**, not just policies defined
  (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`
  if the table owner role is also the app's DB role).
- [ ] Swagger UI auth flow tested end-to-end with a real JWT.
- [ ] Logout invalidates the token immediately (test a reused token post-logout).

---

## Summary of Key Recommendations

- **Pick Option A (Direct JWT)** and own the full chain.
- **Argon2id + pepper**, not bare bcrypt.
- **Short-lived RS256 access tokens + rotating refresh tokens with reuse
  detection**, backed by a Redis revocation list.
- **RLS driven strictly by the verified JWT claim**, re-checked against DB
  on every tenant switch — never trust client-supplied tenant IDs.
- **Add the missing account-lifecycle pieces** (verification, reset, audit
  log, session management, MFA scaffold) — these aren't optional for
  something you're calling "production-grade."
- **Rate limit and generic-error everything auth-related** to kill
  enumeration and brute-force as attack vectors from day one.
