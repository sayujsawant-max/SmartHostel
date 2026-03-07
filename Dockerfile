# Stage 1: Install dependencies and build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy built server
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/

# Copy built shared (server needs it at runtime)
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/shared/package.json ./shared/

# Copy built client (served as static files)
COPY --from=build /app/client/dist ./client/dist

# Copy root package files for workspace resolution
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server/dist/index.js"]
