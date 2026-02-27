# Starswap Frontend & Backend Contract
## Developer Guidelines for the Client Application

This document outlines the specific responsibilities, configurations, and validations that the Starswap frontend is explicitly expected to handle. In the essence of building a highly optimized and focused backend, certain UI-level checks and state validations are securely delegated to the client layer before the API is hit. 

By adhering to these rules, the frontend guarantees a smooth user experience while preventing unnecessary API calls and database strains.

---

### 1. Repository Ownership Verification (Implicit Trust)
**Backend Context:** When a user submits a repository (`POST /api/repo/submit`), the backend validates the format and catches race conditions (double-submits). However, to save database joins and extra GitHub API hits, the backend implicitly trusts that the frontend has already verified the repository belongs to the authenticated user.
**Frontend Responsibility:** 
- The frontend must ensure that users can **only select and submit repositories that they own**. 
- The UI should block or hide repositories where the `owner.login` from the GitHub API does not match the authenticated user's GitHub username. If a user bypasses the UI and hits the API with a foreign repo, they can theoretically submit it under their name. The frontend acts as the primary gatekeeper for this logic.

### 2. Idempotency & The Double-Submit Problem
**Backend Context:** We recently implemented a strict `P2002` Prisma transaction catch to detect and throw a `409 Conflict` if a user attempts a double-submit race condition on repository creation.
**Frontend Responsibility:** 
- The frontend must implement **optimistic disabling**. As soon as the "Submit Repo" button is clicked, the UI must strictly disable the button and show a loading state to prevent the user from double-clicking during latency spikes. 
- The `409` error should be caught and a clean toast notification ("This repository has already been submitted") should be shown, redirecting them away from the submission form.

### 3. Rate Limiting & Debouncing Swipes
**Backend Context:** The `POST /api/swipe` endpoint validates self-swiping, prevents duplicate swipes on the same repo, and handles trust score penalties. There is also a fast Redis rate limiter dropping requests if they exceed human-possible speeds.
**Frontend Responsibility:**
- The frontend must **debounce** or queue the swiping actions. If a user spam-swipes 10 cards in 1 second, the frontend should throttle these network requests to respect the API limits.
- The UI should optimistically update (remove the card from the stack) instantly to feel snappy, but queue the actual API `fetch` requests in the background, handling potential `429 Too Many Requests` or `403 Forbidden` responses gracefully without breaking the UI flow.

### 4. Session Configuration (CORS & Credentials)
**Backend Context:** The backend uses `express-session` backed by a durable Redis store. Sessions are tracked via a strictly partitioned, `httpOnly` cookie (`connect.sid`).
**Frontend Responsibility:**
- Every single API `fetch` or `axios` call made from the Next.js client to the Express API **must include `credentials: 'include'`** (or `withCredentials: true` in Axios). 
- Without this, the browser will strip the session cookie, and the user will appear unauthenticated on every request.

### 5. OAuth Callback Handling
**Backend Context:** The backend exposes a simple `POST /api/auth/github` endpoint that accepts a `code`. It does not handle the initial redirect to GitHub.
**Frontend Responsibility:**
1. The frontend initiates the login by redirecting the user to `https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID`.
2. GitHub redirects back to the frontend (e.g., `http://localhost:3000/auth/callback?code=XYZ`).
3. The frontend extracts the `code` from the URL, posts it to the backend `auth` endpoint, awaits the session cookie, and routes the user to the dashboard.

### 6. Expected Error Handling Matrix
The frontend must be prepared to catch and handle the following standard API errors gracefully:

| CustomError Code | HTTP Status | Meaning | Expected Frontend Action |
| :--- | :--- | :--- | :--- |
| `UNAUTHORIZED` | `401` | Session expired or invalid | Clear local state, redirect to `/login` |
| `FORBIDDEN` | `403` | Self-swipe, banned user | Show toast: "Action not allowed" |
| `NOT_FOUND` | `404` | Repo deleted on GitHub | Show "Repository no longer exists" |
| `CONFLICT` | `409` | Repo already submitted | Redirect to dashboard, show info toast |
| `RATE_LIMIT` | `429` | Spamming swipes/syncs | Pause UI interactions, show 10s cooldown |
| `BAD_REQUEST` | `400` | Invalid GitHub URL / Zod error | Highlight input field, show inline validation |

### 7. Pagination and State Management (Zustand)
**Backend Context:** The `GET /api/user/me/repos` and `GET /api/repo/feed` endpoints now explicitly use robust Cursor-Based database pagination (`?limit=20&cursor=UUID`).
**Frontend Responsibility:**
- The Zustand store must handle **infinite scrolling** appending logic. Instead of replacing the feed array, it must append the incoming `data.feed` to the existing state array, using the `data.nextCursor` for the next fetch.
- If `nextCursor` returns `null`, the frontend should stop triggering fetch calls and show an "End of Feed" graphic.
