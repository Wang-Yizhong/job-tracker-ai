-- CreateTable
CREATE TABLE "public"."ResumeSeries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "activeVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResumeVersion" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceText" TEXT,
    "parsedAt" TIMESTAMP(3),
    "snapshotJson" TEXT,
    "note" TEXT,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResumeField" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "aiSuggestion" TEXT,
    "updatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ResumeField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeSeries_activeVersionId_key" ON "public"."ResumeSeries"("activeVersionId");

-- CreateIndex
CREATE INDEX "ResumeSeries_userId_updatedAt_idx" ON "public"."ResumeSeries"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ResumeSeries_userId_idx" ON "public"."ResumeSeries"("userId");

-- CreateIndex
CREATE INDEX "ResumeVersion_seriesId_uploadedAt_idx" ON "public"."ResumeVersion"("seriesId", "uploadedAt" DESC);

-- CreateIndex
CREATE INDEX "ResumeVersion_seriesId_idx" ON "public"."ResumeVersion"("seriesId");

-- CreateIndex
CREATE INDEX "ResumeField_versionId_order_idx" ON "public"."ResumeField"("versionId", "order");

-- AddForeignKey
ALTER TABLE "public"."ResumeSeries" ADD CONSTRAINT "ResumeSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResumeSeries" ADD CONSTRAINT "ResumeSeries_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "public"."ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResumeVersion" ADD CONSTRAINT "ResumeVersion_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."ResumeSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResumeField" ADD CONSTRAINT "ResumeField_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "public"."ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
