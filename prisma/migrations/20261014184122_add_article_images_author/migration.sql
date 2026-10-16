-- CreateTable/AlterTable for article images and author relation
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "authorId" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Article_authorId_fkey'
  ) THEN
    ALTER TABLE "Article"
      ADD CONSTRAINT "Article_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END $$;
