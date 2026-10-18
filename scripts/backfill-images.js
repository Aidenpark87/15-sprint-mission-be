import { db } from '#prisma/db.js';

const IMAGE_FILES = [
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
];

const IMAGE_RATIO_MODULUS = 10;
const IMAGE_RATIO_THRESHOLD = 7;

const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
const base = baseArg ? baseArg.slice('--base='.length) : '/uploads/seed';
const imagePool = IMAGE_FILES.map(
  (file) => `${base.replace(/\/$/, '')}/${file}`,
);

const isEmpty = (images) => !Array.isArray(images) || images.length === 0;

async function backfill(model, label) {
  const rows = await db.orm.public[model].select('id', 'images').all();
  const emptyRows = rows.filter((row) => isEmpty(row.images));
  const targets = emptyRows.filter(
    (row) => row.id % IMAGE_RATIO_MODULUS < IMAGE_RATIO_THRESHOLD,
  );

  for (const row of targets) {
    await db.orm.public[model]
      .where({ id: row.id })
      .update({ images: [imagePool[row.id % imagePool.length]] });
  }

  console.log(
    `${label}: 전체 ${rows.length} · 비어 있음 ${emptyRows.length} · 채움 ${targets.length}`,
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
