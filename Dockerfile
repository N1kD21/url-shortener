# ---- build stage: has a compiler, because better-sqlite3 is a native module
# and may have to be built from source if no prebuilt binary matches.
FROM node:24-slim AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/config.ts ./src/config.ts
RUN npm ci
COPY src ./src
RUN npm run build

# ---- runtime stage: no compiler, just the built app and its dependencies.
# Dev dependencies are kept on purpose: the Prisma CLI applies migrations at startup.
FROM node:24-slim
# Prisma's migration engine needs OpenSSL, which the slim image does not ship.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=build /app/package.json /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/config.ts ./src/config.ts
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Apply pending migrations, then start. The SQLite file lives wherever
# DATABASE_URL points (a mounted volume in docker-compose.yml).
CMD ["sh", "-c", "npm run prisma:migrate && npm run start:prod"]
