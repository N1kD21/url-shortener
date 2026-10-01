FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

# Dev dependencies are kept on purpose: the build needs the Nest CLI and tsc,
# and the container applies database migrations at startup with the Prisma CLI.
COPY package.json package-lock.json prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm ci --include=dev && npm run build

EXPOSE 3000

# Apply pending migrations, then start. The SQLite file lives wherever
# DATABASE_URL points (a mounted volume in docker-compose.yml).
CMD ["sh", "-c", "npm run prisma:migrate && npm run start:prod"]
