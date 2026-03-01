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

ENV DATABASE_URL="postgresql://root:2026@Password@72.62.231.212:5432/TOW_TEST_1"

ENV DB_HOST=72.62.231.212
ENV DB_PORT=5432
ENV DB_NAME=TOW_TEST_1
ENV DB_USER=root
ENV DB_PASS=2026@Password

ENV JWT_SECRET=TOWCHEN_SECRET
ENV JWT_EXPIRES_IN=7d

ENV STORAGE_PROVIDER=cloudflare-R2

ENV R2_ACCOUNT_ID=f68ec044685c09f59025331b44fd47ab
ENV R2_ACCESS_KEY_ID=9a719d2be18210ebff6d7ac13f08a711
ENV R2_SECRET_ACCESS_KEY=dfab8a8612ea5fa17e636375ccca2a7778835924a6b56705e61eaaa9d9e37965
ENV R2_BUCKET_NAME=towchen
ENV R2_PUBLIC_URL=https://pub-88bff11829e24671b851121c59781ac4.r2.dev

ENV TWILIO_ACCOUNT_SID=AC53cc78e6deb8b97c4428eeeb0c0a4120
ENV TWILIO_AUTH_TOKEN=60df8a68acde99d02db3ea2b4479bec4
ENV TWILIO_PHONE_NUMBER=+15342026289

ENV MAIL_PROVIDER=nodemailer
ENV MAIL_HOST=smtp.gmail.com
ENV MAIL_PORT=587
ENV MAIL_USER=jinvixmanage@gmail.com
ENV MAIL_PASS=uzwqvaplajbmfkyt
ENV MAIL_FROM=jinvixmanage@gmail.com


EXPOSE 3000

CMD ["node", "dist/main"]
