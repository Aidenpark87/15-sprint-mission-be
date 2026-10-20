import { db } from '#prisma/db.js';

const isVerifyUser = (user) =>
  user.email.startsWith('verify_') &&
  user.email.endsWith('@test.com') &&
  user.nickname.startsWith('검증');

async function hasReferences(userId) {
  const counts = await Promise.all([
    db.orm.public.Comment.where({ authorId: userId }).aggregate((agg) => ({
      total: agg.count(),
    })),
    db.orm.public.Article.where({ authorId: userId }).aggregate((agg) => ({
      total: agg.count(),
    })),
    db.orm.public.Product.where({ ownerId: userId }).aggregate((agg) => ({
      total: agg.count(),
    })),
    db.orm.public.Like.where({ userId }).aggregate((agg) => ({
      total: agg.count(),
    })),
    db.orm.public.SocialAccount.where({ userId }).aggregate((agg) => ({
      total: agg.count(),
    })),
  ]);

  return counts.some((row) => row.total > 0);
}

async function cleanup() {
  const users = await db.orm.public.User.select('id', 'nickname', 'email').all();
  const targets = users.filter(isVerifyUser);

  let removed = 0;
  let kept = 0;

  for (const user of targets) {
    if (await hasReferences(user.id)) {
      kept += 1;
      continue;
    }

    await db.orm.public.User.where({ id: user.id }).delete();
    removed += 1;
  }

  console.log(`검증 유저: 대상 ${targets.length} · 삭제 ${removed} · 보존 ${kept}`);
}

cleanup()
  .catch((error) => {
    console.error('검증 유저 정리 오류:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
