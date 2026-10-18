import { db } from '#prisma/db.js';
import { ARTICLE_CLOSINGS, SEED_CATALOG } from './seed-catalog.js';

const catalogByFileName = new Map(
  SEED_CATALOG.map((entry) => [entry.file.split('/').pop(), entry]),
);

const entryForImages = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  return catalogByFileName.get(images[0].split('/').pop()) ?? null;
};

const closingFor = (id) => ARTICLE_CLOSINGS[id % ARTICLE_CLOSINGS.length];

async function backfillArticles() {
  const rows = await db.orm.public.Article.select('id', 'images').all();
  let updated = 0;

  for (const row of rows) {
    const entry = entryForImages(row.images);
    if (!entry) {
      continue;
    }

    await db.orm.public.Article.where({ id: row.id }).update({
      title: entry.articleTitle,
      content: `${entry.articleBody}\n\n${closingFor(row.id)}`,
    });
    updated += 1;
  }

  console.log(`게시글: 전체 ${rows.length} · 사진과 맞춘 글 ${updated}`);
}

async function backfillProducts() {
  const rows = await db.orm.public.Product.select('id', 'images').all();
  let updated = 0;

  for (const row of rows) {
    const entry = entryForImages(row.images);
    if (!entry) {
      continue;
    }

    await db.orm.public.Product.where({ id: row.id }).update({
      name: entry.productName,
      description: entry.productDescription,
      price: entry.productPrice,
    });
    updated += 1;
  }

  console.log(`상품: 전체 ${rows.length} · 사진과 맞춘 상품 ${updated}`);
}

async function main() {
  await backfillArticles();
  await backfillProducts();
}

main()
  .catch((error) => {
    console.error('내용 backfill 오류:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
