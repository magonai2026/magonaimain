# ── Stage 1: build the React app ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps (no devDeps, no build tools)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Gateway server + built frontend
COPY server.js ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app
USER app

CMD ["node", "server.js"]
