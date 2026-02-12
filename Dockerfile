# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.13.0
ARG PNPM_VERSION=10.28.2

################################################################################
# Base stage
FROM node:${NODE_VERSION}-alpine as base

WORKDIR /usr/src/app

# Install pnpm + netcat for DB waiting
RUN npm install -g pnpm@${PNPM_VERSION} && \
    apk add --no-cache netcat-openbsd

################################################################################
# Dependencies stage
FROM base as deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install ALL dependencies (we need devDependencies for drizzle-kit)
RUN pnpm install --frozen-lockfile

################################################################################
# Build stage
FROM base as build

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source files
COPY . .

# Run the build script
RUN pnpm run build

################################################################################
# Final production stage
FROM base as final

ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# --------------------------------------------
# Files needed for drizzle-kit
# --------------------------------------------
COPY --from=build /usr/src/app/drizzle.config.ts ./
COPY --from=build /usr/src/app/auth-schema.ts ./
COPY --from=build /usr/src/app/tsconfig.json ./
COPY --from=build /usr/src/app/drizzle ./drizzle
COPY --from=build /usr/src/app/src/db ./src/db

# --------------------------------------------
# Copy node_modules from BUILD stage (has ALL deps including drizzle-kit & drizzle-orm)
# --------------------------------------------
COPY --from=build /usr/src/app/node_modules ./node_modules

# --------------------------------------------
# Build output
# --------------------------------------------
COPY --from=build /usr/src/app/.next/standalone ./
COPY --from=build /usr/src/app/.next/static ./.next/static
COPY --from=build /usr/src/app/public ./public

# --------------------------------------------
# Server configuration
# --------------------------------------------
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Wait for DB, run migrations, then start server
CMD ["sh", "-c", "\
  echo '=== Waiting for postgres... ==='; \
  until nc -z postgres 5432; do \
    echo 'Waiting for postgres...'; \
    sleep 2; \
  done; \
  echo '=== Postgres is ready! ==='; \
  echo '=== Running drizzle-kit push... ==='; \
  npx drizzle-kit push; \
  npx drizzle-kit studio --port 4983 --host 0.0.0.0; \
  echo '=== Starting server... ==='; \
  node server.js \
"]
