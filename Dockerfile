# ============================================
# Stage 1: Build the application
# ============================================
FROM node:20-alpine AS build

# Build tools needed for argon2 + SWC native binaries
RUN apk add --no-cache python3 make g++ libstdc++

WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS and verify output
RUN npm run build && ls -la dist/

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine AS production

# argon2 + SWC require libstdc++ at runtime
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy package files and install production-only deps
COPY package.json package-lock.json ./

RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --omit=dev \
    && npm rebuild argon2 \
    && apk del .build-deps

# Copy built app and Prisma generated client
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema & migrations (needed for runtime migrations)
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
