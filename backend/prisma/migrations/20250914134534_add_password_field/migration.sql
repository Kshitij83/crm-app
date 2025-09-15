-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "password" TEXT,
ALTER COLUMN "authProvider" SET DEFAULT 'local';
