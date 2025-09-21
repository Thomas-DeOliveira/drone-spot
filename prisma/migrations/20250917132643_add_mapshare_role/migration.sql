-- CreateEnum
CREATE TYPE "public"."MapShareRole" AS ENUM ('READ', 'WRITE');

-- AlterTable
ALTER TABLE "public"."MapShare" ADD COLUMN     "role" "public"."MapShareRole" NOT NULL DEFAULT 'READ';
