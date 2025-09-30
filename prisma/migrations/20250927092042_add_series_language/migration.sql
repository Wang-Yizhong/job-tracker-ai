-- AlterTable
ALTER TABLE "public"."ResumeSeries" ADD COLUMN     "language" TEXT;

-- CreateIndex
CREATE INDEX "ResumeSeries_userId_language_idx" ON "public"."ResumeSeries"("userId", "language");
