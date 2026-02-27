FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV="production" \
    PORT=5000

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
USER node

EXPOSE 5000

# Start command
CMD ["npm", "start"]
