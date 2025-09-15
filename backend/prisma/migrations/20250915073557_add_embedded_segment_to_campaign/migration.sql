-- DropForeignKey
ALTER TABLE "public"."campaigns" DROP CONSTRAINT "campaigns_segmentId_fkey";

-- AlterTable
ALTER TABLE "public"."campaigns" ADD COLUMN     "segmentName" TEXT,
ADD COLUMN     "segmentRules" JSONB,
ALTER COLUMN "segmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "public"."segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
