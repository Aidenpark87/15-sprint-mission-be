import { faker } from '@faker-js/faker';
import { db } from '#prisma/db.js';
import {
  assertSafeSeedInsertTarget,
  assertSafeSeedTarget,
  resetPandaMarketData,
} from './seed-safety.js';

faker.seed(20261004);

const NUM_PRODUCTS_TO_CREATE = 100;
const NUM_ARTICLES_TO_CREATE = 100;
const NUM_COMMENTS_PER_PARENT = 5;

const SEED_DATE_FROM = '2026-09-04';
const SEED_DATE_TO = '2026-10-04';

const PRODUCT_TAG_POOL = ['신상품', '베스트', '리퍼브', '한정판', '무료배송'];

const SEED_IMAGE_POOL = [
  '/uploads/seed/1792114615524-904290374.jpg',
  '/uploads/seed/1792115054630-480197689.jpg',
  '/uploads/seed/1792115072372-784276958.jpg',
  '/uploads/seed/1792115329104-861494006.jpg',
  '/uploads/seed/1792115520412-129669762.jpg',
  '/uploads/seed/1792115520418-496265117.jpg',
  '/uploads/seed/1792115581438-224246519.jpg',
  '/uploads/seed/1792115581439-912652513.jpg',
  '/uploads/seed/1792115788287-958757612.jpg',
  '/uploads/seed/1792116504677-409996226.jpg',
  '/uploads/seed/1792116514037-327195778.jpg',
  '/uploads/seed/1792116541399-200041047.jpg',
  '/uploads/seed/1792130141912-174851857.jpg',
  '/uploads/seed/1792144447893-262668810.jpg',
  '/uploads/seed/1792144459968-431598963.jpg',
  '/uploads/seed/1792311314331-770908361.jpg',
];

const IMAGE_RATIO_MODULUS = 10;
const IMAGE_RATIO_THRESHOLD = 7;

const seedImagesFor = (index) =>
  index % IMAGE_RATIO_MODULUS < IMAGE_RATIO_THRESHOLD
    ? [SEED_IMAGE_POOL[index % SEED_IMAGE_POOL.length]]
    : [];

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

const KOREAN_PRODUCT_POOL = [
  '무선 기계식 키보드',
  '블루투스 무선 이어폰',
  '휴대용 캠핑 테이블',
  '아로마 디퓨저 세트',
  '한라봉 농축 주스 500ml',
  '대용량 리유저블 텀블러',
  '스마트 LED 무드등',
  '노이즈 캔슬링 미니 스피커',
  '코튼 오버핏 티셔츠',
  '메리노 울 목도리',
  '가죽 카드지갑',
  '북유럽풍 무드 캔들',
  '프렌치프레스 커피메이커',
  '규조토 세면대 매트',
  '접이식 노트북 스탠드',
  'USB-C 멀티 허브 8in1',
  '인덕션 주물 냄비',
  '실리콘 주방 장갑 2p',
  '의류 보풀 제거기',
  '휴대용 포토 프린터',
  '고양이 자동 급식기',
  '강아지 방수 간식 파우치',
  '빈티지 감성 미러',
  '원목 책상 정리 트레이',
  '목욕용 규조토 비누 받침대',
  '미니 재봉틀 세트',
  '여행용 압축 파우치 5종',
  '가정용 제빵기',
  '유리 밀폐용기 10종 세트',
  '전기 온열 찜질팩',
  '무선 충전 거치대 듀오',
  '스마트 도어락 키패드',
  '가정용 미니 빔프로젝터',
  '무선 게이밍 마우스',
  '메모리폼 기능성 베개',
  '냉온 양면 기능성 패딩',
  '차량용 헤드레스트 후크',
  '핸드드립 커피 필터 세트',
  '친환경 대나무 화장솜',
  '수면용 무선 이어밴드',
  '휴대용 전동 칫솔 2p',
  '디지털 유리 체중계',
  '자석 화이트보드 달력',
  '접이식 세탁 바구니',
  '스테인리스 키친타월 걸이',
  '레트로 전자시계',
  '핸드워시 디스펜서 세트',
  '무타공 벽선반 2단',
  '자동 미스트 가습기',
  '휴대용 충전 보조배터리',
];

const PRODUCT_SUFFIX_POOL = [
  '',
  '',
  '',
  '',
  ' 2세대',
  ' 2026년형',
  ' 미니',
  ' 프로',
  ' (한정판)',
  ' (리퍼브)',
];

const KOREAN_PRODUCT_DESCRIPTIONS = [
  '거의 새 제품 상태로, 개봉 후 짧게 사용하다 보관했어요. 구성품과 포장박스 모두 포함입니다.',
  '부담 없이 쓸 수 있는 실속형 아이템이에요. 가벼운 사용감 외에 큰 하자는 없습니다.',
  '신품급 컨디션이라 바로 사용 가능합니다. 사진과 동일한 제품을 보내드릴게요.',
  '활용도가 높은 구성이라 취향에 따라 다양하게 쓸 수 있어요. 비흡연 가정에서 보관했습니다.',
  '출시 당시 인기 있었던 모델이에요. 오래 두고 아끼기 좋은 제품입니다.',
  '기능 이상 없고 간단히 세척하면 새것처럼 쓸 수 있어요.',
  '몇 번 사용하지 않아 상태가 좋습니다. 합리적인 가격 제안 환영해요.',
  '고장이나 불량 없이 잘 작동합니다. 믿고 구매하셔도 좋아요.',
  '구성품 누락 없이 전부 포함되어 있어요. 궁금한 점은 댓글로 남겨주세요.',
  '특별한 하자 없이 좋은 상태입니다. 직거래도 가능합니다.',
];

const ARTICLE_TITLES = [
  '판다마켓에서 첫 중고 거래 완료했어요!',
  '중고 노트북 구매 전에 궁금한 점이 있어요',
  '요즘 살 만한 키보드 추천 부탁드립니다',
  '무선 이어폰 배터리 관리 방법 공유해요',
  '캠핑 장비 처음 사보려는데 조언 부탁드려요',
  '이 제품 상태 괜찮은지 봐주세요',
  '가격 제안은 어떻게 하면 좋을까요?',
  '판매자와 거래할 때의 팁 공유합니다',
  '최근에 산 디퓨저 후기입니다',
  '직거래 인증 후기 남겨요',
  '이런 물건은 잘 팔릴까요?',
  '보증서 있어서 안심하고 샀어요',
  '배송 중 파손이 걱정되네요',
  '저렴하게 샀는데 상태가 너무 좋아요',
  '인기 상품 라인업 정리해봤어요',
  '중고 거래 주의사항 정리해봤어요',
  '좋은 판매자를 만나는 기준은 뭘까요?',
  '이 제품 원래 가격이 얼마인가요?',
  '사진보다 실물이 더 낫네요',
  '다들 이 제품 어떻게 생각하세요?',
  '홈카페 꾸미기 추천템 모음',
  '가을에 쓰기 좋은 아이템 소개해요',
  '이사 정리하면서 내놓은 물건들입니다',
  '태그 설정은 어떻게 하세요?',
  '검색이 잘 되는 제목은 뭘까요?',
  '상품 설명을 안 쓰면 안 팔리나요?',
  '첫 게시글이라 두근두근하네요',
  '주말 벼룩시장에 다녀왔어요',
  '중고 제품 새것처럼 만드는 꿀팁',
  '거래 완료 후기 남겨요',
];

const ARTICLE_BODY_SENTENCES = [
  '오늘 직접 사용해 보고 후기를 남겨요.',
  '구매할 때 고민했던 부분을 정리해 봤습니다.',
  '가격 대비 만족도가 꽤 높았어요.',
  '사진보다 실측이 조금 달라서 참고해 주세요.',
  '구성품과 사용감 위주로 사진을 남겼습니다.',
  '초보자 입장에서 정리한 내용이에요.',
  '직거래와 택배 모두 가능합니다.',
  '오래 쓰다 보니 관리 팁이 생겼습니다.',
  '구매를 고민하시는 분들께 도움이 되길 바랍니다.',
  '궁금한 점이 있으면 댓글로 남겨주세요.',
  '다음에는 다른 제품 정보로 찾아올게요.',
  '저는 이 제품을 강력 추천합니다.',
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

const pickMultiple = (pool, min, max) =>
  faker.helpers
    .shuffle(pool)
    .slice(0, faker.number.int({ min, max: Math.min(max, pool.length) }));

const toTimestampString = (date) =>
  date.toISOString().slice(0, 23).replace('T', ' ');

const makeProductInput = (_, index) => ({
  name: `${KOREAN_PRODUCT_POOL[index % KOREAN_PRODUCT_POOL.length]}${pick(PRODUCT_SUFFIX_POOL)}`,
  description: pickMultiple(KOREAN_PRODUCT_DESCRIPTIONS, 1, 2).join(' '),
  price: faker.number.int({ min: 3000, max: 1000000 }),
  images: seedImagesFor(index),
  tags: faker.helpers.arrayElements(PRODUCT_TAG_POOL, {
    min: 0,
    max: PRODUCT_TAG_POOL.length,
  }),
});

const makeArticleInput = (_, index) => ({
  title: pick(ARTICLE_TITLES),
  content: pickMultiple(ARTICLE_BODY_SENTENCES, 2, 4).join('\n\n'),
  images: seedImagesFor(index),
  likeCount: faker.number.int({ min: 0, max: 300 }),

  author: pick(ARTICLE_AUTHOR_POOL),
  createdAt: toTimestampString(
    faker.date.between({ from: SEED_DATE_FROM, to: SEED_DATE_TO }),
  ),
});

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
