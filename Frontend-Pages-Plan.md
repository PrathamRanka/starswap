# Starswap Frontend: Page Architecture & UI Flow

This document maps out the entire Next.js (App Router) frontend, page by page, establishing exactly what components exist, what data is fetched, and what the user sees.

## 1. Landing / Authentication Page (`app/login/page.tsx`)
**Purpose**: The entry point for unauthenticated users driving them to sign up.
**UI Elements**:
*   **Hero Section**: High-impact value proposition ("Discover amazing GitHub repos. Swipe to curate.").
*   **Call to Action (CTA)**: A prominent, glassmorphic "Sign in with GitHub" button.
*   **Background**: Dynamic gradient or moving mesh background for a premium feel.
**Data Interactions**:
*   Clicking CTA hits `http://localhost:5000/api/v1/auth/github` for OAuth redirection.

---

## 2. The Swipe Deck (`app/page.tsx`)
**Purpose**: The core interaction loop. Only accessible if authenticated.
**UI Elements**:
*   **Top Navbar**: Sticky header containing:
    *   Logo (clickable, resets deck).
    *   Streak Flame Icon (e.g., "🔥 5").
    *   User Profile Avatar (links to profile).
*   **The Card Stack (`<SwipeCard />`)**: Centered Framer Motion container holding visually stunning repository cards.
    *   Cards display: `name`, `language` badge, `githubStars` count, and the `pitch` description.
    *   Cards can be dragged left (Skip) or right (Star).
*   **Action Buttons (Optional)**: "X" and "Star" buttons below the card for users who prefer tapping over swiping.
**Data Interactions**:
*   *On Mount*: Fetch `GET /api/v1/repository/feed` and load into Zustand global store.
*   *On Swipe*: Optimistically remove from screen immediately -> Background `POST /api/v1/swipe` -> If right swipe, open `html_url` in a new tab.

---

## 3. Global Leaderboard (`app/leaderboard/page.tsx`)
**Purpose**: The gamified ranking system driving user retention and trust.
**UI Elements**:
*   **Top Navbar**: Standard sticky header.
*   **Podium Header**: Visually distinct top 3 users (Gold, Silver, Bronze styling).
*   **List View**: A sleek, scrollable list of users numbered 4 to 50.
    *   Each row shows: `Rank #`, `Username`, `Leaderboard Score`, and `Streak Count`.
*   **Personal Rank Banner**: A floating bottom banner tracking the current user: "You are ranked #42! Keep swiping to climb."
**Data Interactions**:
*   *On Mount*: Fetch `GET /api/v1/leaderboard` for the list.
*   *On Mount*: Fetch `GET /api/v1/leaderboard/rank/:myId` for the personal banner.

---

## 4. User Profile & Submission (`app/profile/page.tsx`)
**Purpose**: Where a user manages their own stats and adds their projects to the platform.
**UI Elements**:
*   **Top Navbar**: Standard sticky header.
*   **Stats Dashboard**: Grid layout showing total `Stars Given`, `Stars Received`, and current `Trust Score` (if we decide to expose it, otherwise hide).
*   **"Submit Repo" Form**: A glassmorphism card containing:
    *   Input field: `GitHub Repository Name (e.g., facebook/react)`
    *   Input field: `180-character Pitch`
    *   Submit Button.
*   **My Repositories List**: A list of repos this user has submitted, showing their current `Engagement Score` and real-time GitHub Stars.
**Data Interactions**:
*   *On Mount*: Fetch `GET /api/v1/user/me` for stats.
*   *On Mount*: Fetch `GET /api/v1/user/me/repos` for the list.
*   *On Submit*: Call `POST /api/v1/repository`.

---

## 5. Global Layout & State Mechanics
To make this app feel premium and fast, we enforce these architectural rules:
1. **Zustand (`src/store/`)**: Holds the Swipe Feed Array. The UI never waits for the database; it pops the top card off the Zustand array instantly for 0ms latency.
2. **Next.js Middleware (`middleware.ts`)**: Checks for the `connect.sid` HTTP-only cookie. If missing, automatically bounces the user back to `/login` to protect native routes.
3. **Tailwind Context (`globals.css`)**: We will define a strict color palette (e.g., deep purples, glowing neon accents) and custom animations rather than using raw HEX colors inline.
