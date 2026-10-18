import { faker } from '@faker-js/faker';
import { db } from '#prisma/db.js';
import {
  assertSafeSeedInsertTarget,
  assertSafeSeedTarget,
  resetPandaMarketData,
} from './seed-safety.js';
import { ARTICLE_CLOSINGS, SEED_CATALOG } from './seed-catalog.js';

faker.seed(20261004);

const NUM_PRODUCTS_TO_CREATE = 100;
const NUM_ARTICLES_TO_CREATE = 100;
const NUM_COMMENTS_PER_PARENT = 5;

const SEED_DATE_FROM = '2026-09-04';
const SEED_DATE_TO = '2026-10-04';

const PRODUCT_TAG_POOL = ['신상품', '베스트', '리퍼브', '한정판', '무료배송'];

const ARTICLE_AUTHOR_POOL = [
  '행복한 판다',
  '달빛 곰돌이',
  '커피 한 잔',
  '초록 나무늘보',
  '별빛 여우',
  '민들레 바람',
  '반짝이는 별',
  '산책하는 고양이',
  '도토리 다람쥐',
  '파도 타는 펭귄',
  '새벽 공기',
  '소나기 후유',
  '단풍 지는 길',
  '아이스 아메리카노',
  '주말의 주인공',
  '빈티지 라디오',
  '한강의 노을',
  '겨울 옷장',
  '편지 쓰는 하루',
  '느긋한 거북이',
];

const COMMENT_SENTENCES = [
  '좋은 정보 감사합니다!',
  '저도 궁금했던 내용이에요. 덕분에 알았어요.',
  '동의합니다!',
  '이 부분 잘 참고할게요.',
  '다음 게시글도 기대할게요!',
  '저도 비슷한 경험이 있어요.',
  '감사합니다. 도움이 많이 됐어요.',
  '혹시 추가로 여쭤봐도 될까요?',
  '실용적인 팁 감사드려요!',
];

const pick = (pool) => faker.helpers.arrayElement(pool);

const toTimestampString = (date) =>
  date.toISOString().slice(0, 23).replace('T', ' ');

const imagesFor = (entry) => {
  const roll = faker.number.int({ min: 1, max: 10 });
  if (roll >= 10) {
    return [];
  }

  const extraCount = roll === 9 ? 2 : roll >= 7 ? 1 : 0;
  const extras = faker.helpers
    .arrayElements(
      SEED_CATALOG.filter((item) => item.file !== entry.file),
      extraCount,
    )
    .map((item) => item.file);

  return [entry.file, ...extras];
};

const makeProductInput = () => {
  const entry = pick(SEED_CATALOG);

  return {
    name: entry.productName,
    description: entry.productDescription,
    price: Math.max(
      1000,
      entry.productPrice + faker.number.int({ min: -5000, max: 5000 }),
    ),
    images: imagesFor(entry),
    tags: faker.helpers.arrayElements(PRODUCT_TAG_POOL, {
      min: 0,
      max: PRODUCT_TAG_POOL.length,
    }),
  };
};

const makeArticleInput = () => {
  const entry = pick(SEED_CATALOG);

  return {
    title: entry.articleTitle,
    content: `${entry.articleBody}\n\n${pick(ARTICLE_CLOSINGS)}`,
    images: imagesFor(entry),
    likeCount: faker.number.int({ min: 0, max: 300 }),
    author: pick(ARTICLE_AUTHOR_POOL),
    createdAt: toTimestampString(
      faker.date.between({ from: SEED_DATE_FROM, to: SEED_DATE_TO }),
    ),
  };
};

const makeCommentInput = () => ({
  content: pick(COMMENT_SENTENCES),

  createdAt: toTimestampString(
    faker.date.between({ from: SEED_DATE_FROM, to: SEED_DATE_TO }),
  ),
});

async function seed(database) {
  const productData = Array.from(
    { length: NUM_PRODUCTS_TO_CREATE },
    makeProductInput,
  );
  const articleData = Array.from(
    { length: NUM_ARTICLES_TO_CREATE },
    makeArticleInput,
  );

  const products = await database.orm.public.Product.createAll(productData);
  const articles = await database.orm.public.Article.createAll(articleData);

  const commentData = [];
  for (const product of products) {
    for (let index = 0; index < NUM_COMMENTS_PER_PARENT; index += 1) {
      commentData.push({ ...makeCommentInput(), productId: product.id });
    }
  }
  for (const article of articles) {
    for (let index = 0; index < NUM_COMMENTS_PER_PARENT; index += 1) {
      commentData.push({ ...makeCommentInput(), articleId: article.id });
    }
  }

  await database.orm.public.Comment.createAndCount(commentData);

  return {
    productCount: products.length,
    articleCount: articles.length,
    commentCount: commentData.length,
  };
}

async function main(database) {
  const isInsertOnly = process.argv.includes('--no-reset');

  if (!isInsertOnly) {
    assertSafeSeedTarget({
      databaseUrl: process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      args: process.argv,
    });

    await resetPandaMarketData(database);
  } else {
    assertSafeSeedInsertTarget({ databaseUrl: process.env.DATABASE_URL });

    const [productCount, articleCount, commentCount] = await Promise.all([
      database.orm.public.Product.aggregate((agg) => ({ total: agg.count() })),
      database.orm.public.Article.aggregate((agg) => ({ total: agg.count() })),
      database.orm.public.Comment.aggregate((agg) => ({ total: agg.count() })),
    ]);

    if (productCount.total > 0 || articleCount.total > 0 || commentCount.total > 0) {
      console.log('이미 시드된 데이터가 있어 건너뜁니다.');
      return;
    }
  }

  const result = await seed(database);

  console.log(`${result.productCount}개의 상품이 생성되었습니다.`);
  console.log(`${result.articleCount}개의 게시글이 생성되었습니다.`);
  console.log(`${result.commentCount}개의 댓글이 생성되었습니다.`);
}

main(db)
  .catch((error) => {
    console.error('시딩 오류:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
