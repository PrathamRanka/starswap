FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV="production" PORT=5000

# ── Install dependencies ────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Generate Prisma client ───────────────────────────────────
FROM deps AS prisma
COPY prisma ./prisma
RUN npx prisma generate

# ── Final production image ───────────────────────────────────
FROM base AS runner
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=deps   /app/package.json ./package.json
COPY --from=prisma /app/prisma       ./prisma
COPY src ./src

# Run as non-root for security
USER node

EXPOSE 5000

# Runs Prisma migrations then starts the server
CMD ["npm", "start"]
