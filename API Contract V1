# Starswap API Contract Specification

Version: 1.0
Base URL: /api/v1
Content-Type: application/json
Authentication: GitHub OAuth session (NextAuth cookie-based)

---

# 1. API Design Principles

* RESTful resource-based design
* All responses JSON
* Explicit error envelope format
* Versioned base path (/api/v1)
* Idempotency where required
* Rate limits enforced per user

---

# 2. Global Response Format

## 2.1 Success Response

```
{
  "success": true,
  "data": { ... },
  "meta": { ... optional }
}
```

## 2.2 Error Response

```
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... optional }
  }
}
```

---

# 3. Authentication

Auth handled via NextAuth session cookie.

All protected endpoints require authenticated session.

Error if unauthenticated:

Status: 401 Unauthorized

```
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required"
  }
}
```

---

# 4. Endpoints

---

# 4.1 Get Feed

GET /api/v1/feed

## Query Params

| Param  | Type   | Required | Description        |
| ------ | ------ | -------- | ------------------ |
| cursor | string | No       | Pagination cursor  |
| limit  | number | No       | Default 10, max 20 |

## Response Schema

```
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "fullName": "string",
      "pitch": "string",
      "description": "string",
      "languages": ["string"],
      "stars": number,
      "forks": number,
      "visibilityScore": number,
      "owner": {
        "username": "string",
        "avatar": "string"
      }
    }
  ],
  "meta": {
    "nextCursor": "string | null"
  }
}
```

## Errors

* 401 UNAUTHENTICATED
* 429 RATE_LIMITED
* 500 INTERNAL_ERROR

---

# 4.2 Swipe Repository

POST /api/v1/swipe

## Request Schema

```
{
  "repoId": "string",
  "decision": "LEFT" | "RIGHT"
}
```

## Validation Rules

* repoId must exist
* decision must be enum
* Cannot swipe same repo twice

## Success Response

```
{
  "success": true,
  "data": {
    "updatedScore": number,
    "streak": number
  }
}
```

## Errors

| Status | Code           | Description          |
| ------ | -------------- | -------------------- |
| 400    | INVALID_INPUT  | Invalid request body |
| 403    | ALREADY_SWIPED | Duplicate swipe      |
| 404    | REPO_NOT_FOUND | Repo does not exist  |
| 429    | RATE_LIMITED   | Swipe limit exceeded |

---

# 4.3 Submit Repository

POST /api/v1/repository

## Request Schema

```
{
  "githubRepoId": "string",
  "pitch": "string (max 180 chars)"
}
```

## Validation Rules

* Pitch length <= 180
* Repo must belong to authenticated user
* Repo must be public

## Success Response

```
{
  "success": true,
  "data": {
    "repositoryId": "string"
  }
}
```

## Errors

* 400 INVALID_INPUT
* 403 NOT_OWNER
* 409 ALREADY_SUBMITTED

---

# 4.4 Sync Repository Stars

POST /api/v1/repository/{id}/sync

## Success Response

```
{
  "success": true,
  "data": {
    "stars": number,
    "syncedAt": "ISO_DATE"
  }
}
```

## Errors

* 404 REPO_NOT_FOUND
* 429 SYNC_RATE_LIMITED
* 500 GITHUB_API_ERROR

---

# 4.5 Leaderboard

GET /api/v1/leaderboard

## Query Params

| Param  | Type   | Required | Description |         |         |
| ------ | ------ | -------- | ----------- | ------- | ------- |
| period | string | Yes      | weekly      | monthly | alltime |

## Response

```
{
  "success": true,
  "data": [
    {
      "rank": number,
      "username": "string",
      "avatar": "string",
      "score": number,
      "streak": number
    }
  ]
}
```

---

# 5. Rate Limiting Specification

## Limits

* 50 swipes per hour
* 200 swipes per day
* 10 repository submissions per day
* 5 sync calls per hour per repo

## 429 Response

```
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

Headers:

* X-RateLimit-Limit
* X-RateLimit-Remaining
* X-RateLimit-Reset

---

# 6. Error Code Registry

| Code              | Meaning                  |
| ----------------- | ------------------------ |
| UNAUTHENTICATED   | User not logged in       |
| INVALID_INPUT     | Schema validation failed |
| ALREADY_SWIPED    | Duplicate swipe          |
| REPO_NOT_FOUND    | Repo missing             |
| NOT_OWNER         | User not repo owner      |
| ALREADY_SUBMITTED | Repo already exists      |
| RATE_LIMITED      | Limit exceeded           |
| SYNC_RATE_LIMITED | Sync abuse detected      |
| GITHUB_API_ERROR  | Upstream failure         |
| INTERNAL_ERROR    | Unexpected server error  |

---

# 7. Versioning Strategy

Base Path Versioning:

/api/v1

Rules:

* Breaking changes require new version (v2)
* Non-breaking additions allowed in same version
* Deprecated endpoints maintained for 90 days
* Version documented in changelog

Future:

* Optional header-based versioning support

---

# 8. Schema Validation (Zod Example)

Example Swipe Schema:

```
const SwipeSchema = z.object({
  repoId: z.string().min(1),
  decision: z.enum(["LEFT", "RIGHT"])
});
```

All endpoints must:

* Validate request body
* Sanitize strings
* Enforce length limits
* Reject unknown fields

---

# 9. Pagination Strategy

Cursor-based pagination.

Cursor = encoded repoId + visibilityScore.

Advantages:

* Stable ordering
* No offset drift

---

# 10. Idempotency

Endpoints requiring idempotency:

* Repository submission
* Swipe creation

Strategy:

* Unique DB constraints
* Optional Idempotency-Key header support

---

# 11. Security Requirements

* All endpoints HTTPS only
* Session cookie httpOnly + secure
* CSRF protection enabled
* Input validation required
* Rate limiting enforced

---

# 12. Future Extensions

* GraphQL API layer
* WebSocket feed updates
* Admin moderation endpoints
* Analytics endpoints

---

END OF DOCUMENT
