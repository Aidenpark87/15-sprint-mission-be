-- 댓글은 상품 또는 게시글 중 정확히 하나에만 연결되어야 한다.
-- (DB 에 이미 적용되어 있으나 로컬 migrations 폴더에 없어 이력을 정합화한다)
ALTER TABLE "Comment"
ADD CONSTRAINT "chk_Comment_exactly_one_target"
CHECK (
  ("productId" IS NOT NULL AND "articleId" IS NULL)
  OR ("productId" IS NULL AND "articleId" IS NOT NULL)
);