import { db } from '#prisma/db.js';
import { ensureSeedCommenters, SEED_COMMENTER_POOL } from './seed-commenters.js';

const MODULUS = SEED_COMMENTER_POOL.length;

async function backfill() {
  const commenters = await ensureSeedCommenters(db);

  const rows = await db.orm.public.Comment.select('id', 'authorId').all();
  const targets = rows.filter((row) => row.authorId == null);

  if (targets.length > 0) {
    await db.transaction(async (tx) => {
      for (let index = 0; index < MODULUS; index += 1) {
        const userId = commenters[index].id;
        await tx.execute(
          db.raw.sql`
            UPDATE "Comment"
            SET "authorId" = ${userId}
            WHERE "authorId" IS NULL
              AND (("id" - 1) % ${MODULUS}) = ${index}
          `
            .affectedCount()
            .build(),
        );
      }
    });
  }

  const after = await db.orm.public.Comment.select('id', 'authorId').all();
  const remaining = after.filter((row) => row.authorId == null).length;

  console.log(
    `댓글: 전체 ${rows.length} · 대상 ${targets.length} · 남은 익명 ${remaining}`,
  );
  console.log(`작성자: ${commenters.length}명`);
}

backfill()
  .catch((error) => {
    console.error('댓글 작성자 backfill 오류:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
