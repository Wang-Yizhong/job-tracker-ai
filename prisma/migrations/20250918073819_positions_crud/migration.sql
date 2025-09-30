-- CreateEnum
CREATE TYPE "public"."PositionStatus" AS ENUM ('DRAFT', 'SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'HIRED');

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "link" TEXT,
    "source" TEXT,
    "status" "public"."PositionStatus" NOT NULL DEFAULT 'SAVED',
    "priority" INTEGER,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Position_userId_createdAt_idx" ON "public"."Position"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Position_userId_status_idx" ON "public"."Position"("userId", "status");

-- CreateIndex
CREATE INDEX "Position_userId_company_idx" ON "public"."Position"("userId", "company");

-- CreateIndex
CREATE INDEX "Position_userId_title_idx" ON "public"."Position"("userId", "title");

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
