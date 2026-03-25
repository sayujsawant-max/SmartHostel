# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
RUN npm ci

# Stage 2: Build shared (both client and server depend on it)
FROM deps AS shared-build
COPY shared/ ./shared/
COPY tsconfig.base.json ./
RUN npm run build -w shared

# Stage 3: Build client
FROM shared-build AS client-build
COPY client/ ./client/
RUN npm run build -w client

# Stage 4: Build server
FROM shared-build AS server-build
COPY server/ ./server/
RUN npm run build -w server

# Stage 5: Production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy root package files for workspace resolution
COPY --from=deps /app/package.json ./
COPY --from=deps /app/package-lock.json ./

# Copy built shared (server needs it at runtime)
COPY --from=shared-build /app/shared/dist ./shared/dist
COPY --from=shared-build /app/shared/package.json ./shared/

# Copy built client (served as static files by Express)
COPY --from=client-build /app/client/dist ./client/dist

# Copy built server
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package.json ./server/

# Copy client package.json for workspace resolution
COPY --from=deps /app/client/package.json ./client/

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server/dist/index.js"]
