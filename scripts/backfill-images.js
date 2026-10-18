import { db } from '#prisma/db.js';

const SEED_IMAGE_POOL = Array.from(
  { length: 17 },
  (_, index) => `/uploads/seed/seed-${String(index + 1).padStart(2, '0')}.jpg`,
);

const LEGACY_IMAGE_FILES = new Set([
  '1792114615524-904290374.jpg',
  '1792115054630-480197689.jpg',
  '1792115072372-784276958.jpg',
  '1792115329104-861494006.jpg',
  '1792115520412-129669762.jpg',
  '1792115520418-496265117.jpg',
  '1792115581438-224246519.jpg',
  '1792115581439-912652513.jpg',
  '1792115788287-958757612.jpg',
  '1792116504677-409996226.jpg',
  '1792116514037-327195778.jpg',
  '1792116541399-200041047.jpg',
  '1792130141912-174851857.jpg',
  '1792144447893-262668810.jpg',
  '1792144459968-431598963.jpg',
  '1792311314331-770908361.jpg',
]);

const IMAGE_RATIO_MODULUS = 10;
const IMAGE_RATIO_THRESHOLD = 9;
const IMAGE_SPREAD_MULTIPLIER = 7;
const IMAGE_SPREAD_OFFSET = 3;

const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
const base = baseArg ? baseArg.slice('--base='.length) : '/uploads/seed';
const isForce = process.argv.includes('--force');

const imagePool = SEED_IMAGE_POOL.map((path) =>
  path.replace('/uploads/seed', base.replace(/\/$/, '')),
);

const imageCountFor = (seedNo) => {
  const bucket = seedNo % IMAGE_RATIO_MODULUS;

  if (bucket >= IMAGE_RATIO_THRESHOLD) return 0;
  if (bucket < 6) return 1;
  if (bucket < 8) return 2;

  return 3;
};

const imagesFor = (seedNo) => {
  const count = imageCountFor(seedNo);
  if (count === 0) return [];

  const start =
    (seedNo * IMAGE_SPREAD_MULTIPLIER + IMAGE_SPREAD_OFFSET) % imagePool.length;

  return Array.from(
    { length: count },
    (_, offset) => imagePool[(start + offset) % imagePool.length],
  );
};

const isSeededImage = (path) => {
  if (typeof path !== 'string') return false;

  return (
    path.startsWith('/uploads/seed/') ||
    LEGACY_IMAGE_FILES.has(path.split('/').pop())
  );
};

const needsImages = (images) =>
  !Array.isArray(images) ||
  images.length === 0 ||
  (isForce && images.every(isSeededImage));

async function backfill(model, label) {
  const rows = await db.orm.public[model].select('id', 'images').all();
  const targets = rows.filter((row) => needsImages(row.images));

  for (const row of targets) {
    await db.orm.public[model]
      .where({ id: row.id })
      .update({ images: imagesFor(row.id) });
  }

  console.log(
    `${label}: 전체 ${rows.length} · 대상 ${targets.length} (${isForce ? 'force' : '빈 행만'})`,
  );
}

async function main() {
  console.log(`이미지 base 경로: ${base}`);

  await backfill('Article', '게시글');
  await backfill('Product', '상품');
}

main()
  .catch((error) => {
    console.error('이미지 backfill 오류:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
