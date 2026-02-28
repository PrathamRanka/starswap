# StarSwap

StarSwap is a production-grade social discovery engine designed exclusively for open-source developers. Modeled after modern swiping interfaces, StarSwap allows users to rapidly discover, rate, and pitch GitHub repositories to a worldwide audience. It couples a highly optimized Next.js frontend with a deeply secure Express.js gateway, governed by Redis-backed rate limiters and real-time PostgreSQL synchronization.

![StarSwap Hero Interface](./client/public/hero-preview.png)

---

## Technical Overview

StarSwap handles highly concurrent state mutations (user swipes) while maintaining precision guarantees regarding database race conditions and exact ranking calculations. It leverages an event-driven architecture that verifies GitHub OAuth access tokens securely without retaining vulnerable secrets on the client natively. 

### Core Stack
* **Frontend Component:** Next.js (App Router), React, Tailwind CSS, Framer Motion
* **API Gateway / Backend:** Node.js, Express.js
* **Relational Database:** PostgreSQL managed via Prisma ORM
* **In-Memory Cache / Queues:** Redis
* **Analytics:** Vercel Analytics

---

## System Architecture

The following diagram illustrates the High-Level Design (HLD) and low-level data flows of the StarSwap platform, from the Vercel Edge Cache down to the Redis connection pool.

```mermaid
flowchart TB

    %% ── LAYER 1: CLIENT ──────────────────────────────────────────
    subgraph Client [" 🖥️  Client — Browser UI "]
        direction LR
        NextApp[Next.js React Frontend]
        AuthContext[Global Auth Provider]
        SwipeDeck[Framer Motion Swipe Deck]
        LeaderboardUI[Real-Time Leaderboard]

        NextApp --> AuthContext
        NextApp --> SwipeDeck
        NextApp --> LeaderboardUI
    end

    %% ── LAYER 2: NETWORK EDGE ────────────────────────────────────
    subgraph Network [" 🌐  Network Edge "]
        direction LR
        VercelCDN[Vercel Edge Network + WAF]
        ExpressCORS[CORS Policy + Helmet Headers]

        VercelCDN -.->|HTTPS| ExpressCORS
    end

    %% ── LAYER 3: BACKEND GATEWAY ─────────────────────────────────
    subgraph BackendAPI [" ⚙️  Express / Node.js — API Gateway "]
        direction TB
        RateLimiter{Token Bucket\n100 req / 15 min}
        Router[API Route Controllers]

        subgraph Workers [" Core Workers "]
            direction LR
            SessionWorker[OAuth Encrypter\nSession Manager]
            SwipeProcessor[Swipe Velocity Engine\nMax 30 swipes / min]
            FeedGenerator[Cursor Feed Generator\nOptimistic Cache Reader]
        end

        subgraph Handlers [" Integrity Handlers "]
            direction LR
            P2002Suppressor[P2002 Race Condition Handler\nUnique Constraints]
            ReverseHook[syncStaleSwipes\nBackground Validator]
        end

        RateLimiter --> Router
        Router --> SessionWorker
        Router --> SwipeProcessor
        Router --> FeedGenerator
        SwipeProcessor --> P2002Suppressor
        FeedGenerator --> ReverseHook
    end

    %% ── LAYER 4: PERSISTENCE ─────────────────────────────────────
    subgraph Database [" 🗄️  Persistence + Memory Layers "]
        direction LR

        subgraph Redis [" ⚡ Redis Cluster "]
            direction TB
            RedisKeys[(Session Tokens\nFeed Cache · TTL 60s)]
            RedisZset[(ZSET Leaderboard\nO log N Ranking)]
        end

        subgraph Postgres [" 🐘 PostgreSQL · Prisma ORM "]
            direction TB
            UsersTable([User Schema\nAccounts + OAuth Tokens])
            RepoTable([Repository Schema\nActive + Archived])
            SwipeLog([SwipeAction Log\nForeign Constraints])
        end
    end

    %% ── LAYER 5: EXTERNAL ────────────────────────────────────────
    subgraph External [" 🐙  External APIs "]
        GitHub[GitHub REST API v3]
    end

    %% ══════════════════════════════════════════════════════════════
    %% SYNCHRONIZED FLOW — top to bottom
    %% ══════════════════════════════════════════════════════════════

    %% 1. Client → Edge
    Client -->|API Requests| VercelCDN

    %% 2. Edge → Gateway
    ExpressCORS --> RateLimiter

    %% 3. Auth flow
    AuthContext -.->|Session Poll| SessionWorker
    SessionWorker -->|Encrypted Tokens| UsersTable
    SessionWorker -->|R/W Session Cookie| RedisKeys
    SessionWorker <-->|OAuth Code Exchange| GitHub

    %% 4. Swipe flow
    SwipeDeck -.->|POST /api/v1/swipe| SwipeProcessor
    SwipeProcessor -->|Check Rate Limit| RedisKeys
    P2002Suppressor -->|Atomic Upsert| Postgres
    P2002Suppressor -->|Update Live Score| RedisZset
    P2002Suppressor -->|Star via Token| GitHub

    %% 5. Feed flow
    FeedGenerator -->|Top 10 Cache Hit| RedisKeys
    FeedGenerator -.->|Cache Miss Fallback| Postgres
    ReverseHook <-->|HTTP 404 Validation| GitHub
    ReverseHook -->|Prune Invalid Swipes| Postgres

    %% 6. Leaderboard read
    LeaderboardUI -.->|GET /leaderboard| Router
    Router -->|Ranked Read| RedisZset

    %% ══════════════════════════════════════════════════════════════
    %% STYLES
    %% ══════════════════════════════════════════════════════════════

    classDef client     fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0;
    classDef network    fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#e0e7ff;
    classDef backend    fill:#052e16,stroke:#22c55e,stroke-width:2px,color:#dcfce7;
    classDef memory     fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fee2e2;
    classDef db         fill:#0c1a3a,stroke:#60a5fa,stroke-width:2px,color:#dbeafe;
    classDef external   fill:#1a1b1e,stroke:#6b7280,stroke-width:2px,color:#a5a6a9;
    classDef decision   fill:#3f3f00,stroke:#facc15,stroke-width:2px,color:#fef9c3;

    class NextApp,AuthContext,SwipeDeck,LeaderboardUI client;
    class VercelCDN,ExpressCORS network;
    class Router,SessionWorker,SwipeProcessor,FeedGenerator,P2002Suppressor,ReverseHook backend;
    class RedisKeys,RedisZset memory;
    class UsersTable,RepoTable,SwipeLog db;
    class GitHub external;
    class RateLimiter decision;

```

---

## Key Features

### 1. The Global Swipe Deck
A fluid, touch-optimized swiping interface built entirely with Framer Motion. 
* Pulls repository cards strictly from a `NOT EXISTS` queue out of PostgreSQL.
* Validates user actions (Right Swipe = Star, Left Swipe = Skip).
* Visually communicates code language, GitHub Stars, and the developer's custom 180-character pitch.

![Swipe Deck Interaction](./client/public/swipe-preview.png)

### 2. Live Global Leaderboard
A fiercely competitive real-time ranking index updated instantly based on community interactions.
* Automatically calculates visibility scores relying on algorithmic weights (Swipes * Weights / Degradation).
* Identifies users on daily 'streaks' to artificially boost their algorithm priority.

![Global Leaderboard](./client/public/leaderboard-preview.png)

### 3. Repository Pitch Control & Global Resets
Users have complete autonomy over how their project is portrayed to the community.
* Users authenticate purely via genuine GitHub OAuth (ensuring zero fake accounts).
* A developer can update a repository's pitch, triggering a backend purge of historical `SwipeAction` logs, which aggressively throws the repository back into the global feed queue.

![User Profile Settings](./client/public/profile-preview.png)

### 4. Advanced Security & Protections
* **Token Bucket Algorithm:** Custom Redis-based rate limiters enforce maximum velocity constraints (e.g., maximum 30 swipes per minute per IP).
* **Cross-Origin Resource Sharing (CORS):** Strictly validated against explicit production environments. 
* **Database Deadlock Prevention:** Prisma uses custom `try/catch` interceptors anticipating `P2002` constraint failures during concurrent swipe anomalies.

---

## Local Development Setup

To test and contribute to StarSwap locally, you must run both the unified Backend Gateway and the independent Next.js client.

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL Database (Local or Cloud URL)
* Redis Server (Running locally on port 6379, or Cloud URL)
* A registered GitHub OAuth Application

### 1. Cloning the Repository
```bash
git clone https://github.com/PrathamRanka/starswap.git
cd starswap
```

### 2. Backend Environment Configuration
Navigate to the `server/` directory and create a `.env` file.

```env
# /server/.env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/starswap"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://localhost:3000"

# Security
SESSION_SECRET="your_very_long_secure_random_string"

# GitHub OAuth
GITHUB_CLIENT_ID="your_client_id"
GITHUB_CLIENT_SECRET="your_client_secret"
GITHUB_CALLBACK_URL="http://localhost:5000/api/v1/auth/github/callback"
```

### 3. Backend Execution
Install dependencies and seed the database schemas.

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 4. Frontend Environment Configuration
Navigate to the `client/` directory and configure the Next.js environment variables.

```env
# /client/.env.local
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

### 5. Frontend Execution
Start the development server.

```bash
cd client
npm install
npm run dev
```

StarSwap will now be available on your local network at `http://localhost:3000`.

---

## Application Programming Interfaces

The system operates via explicit and isolated endpoint routes authenticated via securely signed session cookies.

**Auth Routes:**
* `GET /api/v1/auth/github` - Initiates the OAuth flow.
* `GET /api/v1/auth/github/callback` - Verifies the payload and assigns a session.

**Core Interactions:**
* `GET /api/v1/repository/feed` - Fetches un-swiped repositories from the Prisma layer.
* `POST /api/v1/repository` - Validates and inserts a new project into the queue.
* `PATCH /api/v1/repository/pitch` - Modifies pitch content and executes a `deleteMany` flush on historical SwipeActions.
* `POST /api/v1/swipe` - Commits a Swipe payload (`STAR` or `SKIP`).

**User Context:**
* `GET /api/v1/leaderboard` - Compiles and calculates real-timed rankings.
* `GET /api/v1/user/me` - Resolves the current session user's statistics.
* `GET /api/v1/user/me/repos` - Maps the user's previously published content.

---

## Architecture Quality Standards

This application observes rigid engineering standards:
1. No inline styles. Pure Tailwind utility classes.
2. Abstracted API layer routing all fetches linearly through a unified Axios instance.
3. No native HTML `<a>` tags for internal routing, strictly `next/link`.

For technical discussion or bug reporting, please refer to the Issues tab on this repository.
