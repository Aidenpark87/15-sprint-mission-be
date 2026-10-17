import postgres from '@prisma/orm-postgres/runtime';
import { config } from '#config';
import contractJson from './contract.json' with { type: 'json' };

// Prisma 7은 세션 시간대를 UTC로 고정해 timestamp 컬럼을 UTC로 저장했습니다.
// Prisma 8 런타임은 접속 세션의 기본 시간대(Asia/Seoul)를 그대로 쓰므로,
// 기존 데이터와 createdAt·updatedAt 기준을 맞추기 위해 UTC로 고정합니다.
function withUtcTimezone(databaseUrl) {
  const url = new URL(databaseUrl);
  url.searchParams.set('options', '-c timezone=UTC');
  return url.toString();
}

export const db = postgres({
  contractJson,
  url: withUtcTimezone(config.DATABASE_URL),
});
