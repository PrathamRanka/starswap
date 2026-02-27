# Starswap API Documentation

This document outlines the available backend endpoints, their expected inputs, and guaranteed output structures. This is a reference for Frontend developers to easily consume the API without looking at the backend codebase.

## Base URL
All requests must be prefixed with the API version:
`http://localhost:5000/api/v1`

---

## Standard Response Format
Every single API response (success or failure) will follow this exact JSON structure:

**Success Response (HTTP 200/201)**
```json
{
  "success": true,
  "data": { ... } // Or an array [...]
}
```

**Error Response (HTTP 4xx/5xx)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT", // Machine readable code
    "message": "Validation failed" // Human readable string
  }
}
```

---

## 1. Authentication Module

### `GET /auth/github`
Initializes the GitHub OAuth flow.
**Input**: None (Browser redirect).
**Action**: Redirects user to GitHub for consent.
**Returns**: 302 Redirect to `/auth/github/callback`.

### `GET /auth/github/callback`
**Input**: Managed by GitHub.
**Action**: Creates DB user, establishes an HttpOnly session.
**Returns**: 302 Redirect to `FRONTEND_URL`.

### `POST /auth/logout`
**Input**: None.
**Action**: Destroys the user session cookie securely.
**Returns**: `{ "success": true, "message": "Logged out successfully" }`

---

## 2. User Module

### `GET /user/me`
Fetches the currently authenticated user's private data.
**Input**: None (relies on session cookie).
**Returns**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "githubId": "12345",
    "username": "pratham",
    "leaderboardScore": 150.5,
    "streakCount": 5,
    "starsGiven": 12,
    "starsReceived": 40,
    "role": "USER",
    "createdAt": "2026-02-27T...",
    // NEVER returns trustScore or accessToken natively
  }
}
```

### `GET /user/me/repos`
Fetches repositories submitted by the authenticated user.
**Input**: None
**Returns**: 
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "starswap",
      "githubStars": 150,
      "engagementScore": 12 
    }
  ]
}
```

### `GET /user/:id`
Fetches a public profile for any user by their ID.
**Input**: `id` in the URL path.
**Returns**: Public safe data (hides email, role, trustScore).
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "pratham",
    "streakCount": 5,
    "leaderboardScore": 150.5
  }
}
```

---

## 3. Repository & Feed Module

### `POST /repository`
Submits a new repository to the platform.
**Input (JSON)**:
```json
{
  "githubRepoId": "Repository full_name (e.g. facebook/react)",
  "pitch": "A short 180 character elevator pitch for the repo." // Optional
}
```
**Returns**: The created repository object.

### `POST /repository/:id/sync`
Forces an immediate sync of GitHub stars for a specific repo.
*Note: Rate limited to 5 syncs per hour per repo via Redis.*
**Input**: `id` in the URL path.
**Returns**:
```json
{
  "success": true,
  "data": {
    "stars": 2045,
    "syncedAt": "2026-02-27T..."
  }
}
```

### `GET /repository/feed`
Fetches the next batch of repositories for the Swipe Deck. Excludes repos the user owns, and repos the user has already swiped on.
**Query Params**:
* `limit` (optional, default 10)
* `cursor` (optional, pass the `nextCursor` from the previous response for pagination)
**Returns**:
```json
{
  "success": true,
  "data": {
    "feed": [
      {
        "id": "uuid",
        "name": "nextjs",
        "pitch": "The React Framework",
        "githubStars": 120000,
        "language": "TypeScript"
        // ...
      }
    ],
    "nextCursor": "uuid-of-last-item" // Pass this in the next request
  }
}
```

---

## 4. Swipe Engine

### `POST /swipe`
Records a user's decision (Left/Right swipe) on a repository.
**Input (JSON)**:
```json
{
  "repoId": "uuid of the repository",
  "type": "RIGHT" // Must be exactly "LEFT" or "RIGHT"
}
```
**Action**:
1. Checks Redis for velocity abuse (max 50 swipes/hr).
2. Calculates trust mathematically (if 100% right-swipe ratio, penalizes `trustScore`).
3. If RIGHT, increases repo `engagementScore` and owner's `starsReceived`.
**Returns**: `{ "success": true, "data": { "swipeId": "uuid" } }`

---

## 5. Leaderboard

### `GET /leaderboard`
Fetches the globally ranked top users from the Redis ZSET queue.
**Query Params**:
* `limit` (optional, default 50)
**Returns**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "pratham",
      "leaderboardScore": 994.2
    }
  ]
}
```

### `GET /leaderboard/rank/:userId`
Fetches the specific numeric rank of a specific user.
**Input**: `userId` in URL.
**Returns**:
```json
{
  "success": true,
  "data": {
    "rank": 4 // They are #4 on the leaderboard
  }
}
```

---

## 6. Admin Panel (Requires `role: "ADMIN"`)

### `GET /admin/abuse-logs`
Fetches recent automated system flags for spamming bots.
**Query**: `limit`, `offset`
**Returns**: Array of log objects with embedded user warnings.

### `GET /admin/flagged-users`
Fetches a list of highly suspicious accounts (`trustScore < 0.7`).
**Returns**: Array of users with their `trustScore` and `isBlocked` status.

### `POST /admin/users/:id/block`
Toggles a user's suspension status. Suspended users cannot appear on the leaderboard.
**Returns**: `{ "success": true, "data": { "isBlocked": true } }`

### `POST /admin/users/:id/reset-trust`
Manually forgives a user and resets their `trustScore` back to `1.0`.
