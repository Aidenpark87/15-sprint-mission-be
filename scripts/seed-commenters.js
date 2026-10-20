import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const SEED_COMMENTER_POOL = [
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

export const seedCommenterEmail = (index) =>
  `seed_commenter_${String(index + 1).padStart(2, '0')}@seed.local`;

export async function ensureSeedCommenters(database) {
  const commenters = [];

  for (let index = 0; index < SEED_COMMENTER_POOL.length; index += 1) {
    const email = seedCommenterEmail(index);
    const nickname = SEED_COMMENTER_POOL[index];

    const foundByEmail = await database.orm.public.User.where({ email })
      .select('id', 'nickname')
      .first();
    if (foundByEmail) {
      commenters.push(foundByEmail);
      continue;
    }

    const foundByNickname = await database.orm.public.User.where({ nickname })
      .select('id', 'nickname')
      .first();
    if (foundByNickname) {
      commenters.push(foundByNickname);
      continue;
    }

    const encryptedPassword = await bcrypt.hash(randomUUID(), SALT_ROUNDS);
    const created = await database.orm.public.User.select('id', 'nickname')
      .create({ email, nickname, image: null, encryptedPassword });
    commenters.push(created);
  }

  return commenters;
}
