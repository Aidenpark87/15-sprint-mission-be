# Cloud Run 백엔드 이미지 — Express 5 + Prisma 7 (Node 26, ESM)
# 빌드는 Cloud Build에서 대행하므로 로컬 Docker 없이 `gcloud run deploy --source`로 배포됩니다.
FROM node:26-slim
WORKDIR /app

RUN npm install -g pnpm@11.24.0

# pnpm install의 postinstall(prisma generate)이 DATABASE_URL을 요구하므로
# 빌드 시점에만 쓰는 임시 값을 넣어 둡니다. 실제 값은 실행 시 Secret으로 주입합니다.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.js ./
COPY prisma ./prisma
COPY generated ./generated
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY scripts ./scripts
COPY eslint.config.js jsconfig.json ./

EXPOSE 8080
CMD ["node", "src/server.js"]
