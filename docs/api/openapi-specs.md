# Flowline — API Contracts & Swagger Documentation

Flowline follows a **contract-first API approach** using OpenAPI 3.0. This allows both frontend and backend teams (as well as external API consumers) to interact with and test APIs with full documentation and mock support.

---

## 1. Accessing Swagger UI

When running the application locally:
* **Interactive Swagger UI:** `http://localhost:3000/api/docs`
* **Raw OpenAPI JSON Spec:** `http://localhost:3000/api/openapi.json`

### Authentication in Swagger UI
1. Click the **Authorize** button in Swagger UI.
2. Enter your JWT Bearer token: `Bearer <your_token>`.
3. Provide optional header `x-company-id` to simulate multi-tenant requests.

---

## 2. Generating Client TypeScript Types

To keep frontend hooks in sync with API schemas, generate TypeScript definitions from the OpenAPI JSON spec:

```bash
# Run from workspace root
npx openapi-typescript http://localhost:3000/api/openapi.json -o packages/types/src/api-schema.ts
```

---

## 3. Standard API Conventions

### Cursor-Based Pagination
All list endpoints return paginated responses in the standard format:

```json
{
  "data": [ ... ],
  "nextCursor": "eyJpZCI6MTAwfQ==",
  "hasMore": true,
  "totalEstimated": 5420
}
```

### Standard HTTP Status Codes
* `200 OK`: Successful retrieval / update
* `201 Created`: Resource created
* `400 Bad Request`: Validation failure (includes field error details)
* `401 Unauthorized`: Missing or invalid JWT
* `403 Forbidden`: Cross-tenant access attempted (prevented by RLS)
* `429 Too Many Requests`: Rate limit exceeded
