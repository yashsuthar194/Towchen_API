# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

# argon2 requires native compilation tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ============================================
# Stage 3: Production image
# ============================================
FROM node:20-alpine AS production

# argon2 requires libstdc++ at runtime
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy package files and install production-only deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# argon2 needs to be rebuilt for the clean production node_modules
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm rebuild argon2 \
    && apk del .build-deps

# Copy built app and generated Prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated

# Copy Prisma schema & migrations (needed for runtime migrations)
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main"]
