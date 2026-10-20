import { db } from '#prisma/db.js';

const FAVORITE_MODULUS = 200;
const FAVORITE_MULTIPLIER = 73;

const favoriteCountFor = (id) =>
  1 + ((id * FAVORITE_MULTIPLIER) % FAVORITE_MODULUS);

async function backfill() {
  const rows = await db.orm.public.Product.select('id', 'favoriteCount').all();

  let updated = 0;
  const values = [];
  for (const row of rows) {
    const next = favoriteCountFor(row.id);
    values.push(next);

    if (row.favoriteCount === next) {
      continue;
    }

    await db.orm.public.Product.where({ id: row.id }).update({
      favoriteCount: next,
    });
    updated += 1;
  }

  const distinct = new Set(values).size;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  console.log(
    `상품: 전체 ${rows.length} · 갱신 ${updated} (1~${FAVORITE_MODULUS}, 0 없음)`,
  );
  console.log(`분포: min ${min} · max ${max} · 서로 다른 값 ${distinct}종`);
}

backfill()
  .catch((error) => {
    console.error('좋아요 backfill 오류:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
