FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 5000
CMD ["node", "src/server.js"]