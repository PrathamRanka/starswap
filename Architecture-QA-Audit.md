# Starswap Backend: QA & Architecture Audit Report

**Date**: Feb 27, 2026
**Auditor**: Senior Backend Architect (Antigravity)
**Status**: ⚠️ Passed with Remediation Advised (Score: 8.5/10)

Upon deep inspection of the schema, logic layers, API routes, and background jobs, the core architecture is highly robust. The separation of concerns (Controller > Service > Repository) holds strong. However, there are missing edge cases and scalability bottlenecks that must be addressed for true "flawless" production scale.

---

## 1️⃣ Schema & Database Audit (Score: 9/10)
**Positives**:
*   Cascading deletes are correctly configured (`onDelete: Cascade`) for Accounts, Sessions, Swipes, Streaks, and Logs. If a User is deleted, no orphan records survive.
*   Unique compound constraints applied to `[userId, repoId]` in `SwipeAction` gracefully reject database-level duplicate swipes.
**Critical Issues**: None.
**Minor Improvements**:
*   `Repo` model has `@@index([ownerId])`, `@@index([engagementScore])`, but filtering by `isActive` is the primary feed lookup. We are missing a compound index `@@index([isActive, engagementScore])` for optimal feed querying at scale.

## 2️⃣ Business Logic Verification (Score: 8/10)
**Positives**:
*   Swipe logic executes strictly inside a `prisma.$transaction`. Race conditions where two requests hit the backend at the same millisecond to update score are neutralized by transaction locking.
*   The newly patched Mathematical algorithms (Logarithmic decay) are state-of-the-art.
**Medium Risks**:
*   **Duplicate Repo Submissions via Race Condition**: `repo.service.js` checks `if(existing)` then fetches from GitHub, *then* creates the Repo. Between `if(existing)` and `create()`, an API delay could allow a double-submit. A database-level `UNIQUE` constraint exists on `githubId`, which catches this, but Prisma will throw a raw generic error rather than a cleanly handled 409 CustomError.
*   **Incomplete GitHub URL validation**: We trust the user sends `facebook/react`. If they send `/malicious/` we waste 500ms hitting a 404.

## 3️⃣ Authentication & Session Flow (Score: 7/10)
**Medium Risks**:
*   **Axios Dependency Remnant**: In the previous sprint, we removed `axios` in favor of native Node `fetch`. However, `src/features/auth/auth.service.js` is still executing the GitHub OAuth token-exchange using `axios.post`. This will fail at runtime if `axios` was entirely stripped from `package.json`.
*   **Session State Injection**: The session memory relies on `express-session`. While functional, if this app runs on a serverless Edge function (like Vercel), in-memory sessions vanish on every cold start. A Redis session store adapter should be mounted into `express-session` for persistence.

## 4️⃣ API Layer Review (Score: 9/10)
**Positives**:
*   Validation is cleanly isolated to `Zod` schemas (e.g., `validations/repo.schema.js`).
*   The `error.middleware.js` correctly formats all `ZodError` and generic throws into standard API responses.
**Minor Improvements**:
*   Missing pagination on `GET /user/me/repos`. If a user submits 500 repos over 2 years, it will load the entire payload into memory at once.

## 6️⃣ Performance & Scalability (Score: 8/10)
**Positives**:
*   The Feed engine (`repo.service.js`) uses cursor-based pagination and caches output to Redis for 60 seconds. This is brilliant and achieves true O(1) performance during traffic spikes.
**Major Risk (N+1 Query)**:
*   `leaderboardRecalc.job.js` fetches `allUsers` including `reposOwned.starsReceived`. It then loops through every user. In a DB with 50,000 users owning 100,000 repos, this eagerly loads millions of rows into Node.js RAM at once, causing an immediate Out Of Memory (OOM) crash.
*   *Fix Required*: This job should use SQL `GROUP BY` via `prisma.repo.aggregate` or process users in chunked batches (`take: 1000, skip: X`).

## 7️⃣ Security Review (Score: 9/10)
**Positives**:
*   `trustScore` arithmetic drops never fall below zero due to `Math.max(0.05)`.
*   Self-swiping is blocked via ID matching.
**Minor Risk**:
*   Profile APIs (`userService.getPrivateProfile`) manually cherry-pick which database columns to return to prevent leaking tokens. If a new sensitive column (e.g. `billingId`) is added to the schema later, developers must remember not to explicitly return it. Explicit `select: {}` inside Prisma is safer than stripping after fetching `findUnique()`.

---

## 8️⃣ Final Verdict
**Architecture Rating**: 8.5 / 10

**Is this production-ready?**
Almost. It is safe to build the frontend against, but if you launch to 10,000 live users today, the `leaderboardRecalc` job will likely crash the server's RAM. 

### Recommended Action Plan Before Launch:
1. **Critical Functionality**: Replace the residual `axios` usage in `auth.service.js` with native `fetch` so logins do not crash.
2. **Critical Scalability**: Refactor `leaderboardRecalc.job.js` to process users in batches of 500 rather than fetching `allUsers` simultaneously.
3. **Medium Enhancement**: Attach `connect-redis` to `sessionConfig` to ensure sessions survive server restarts.
