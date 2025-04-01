/*
  Warnings:

  - The values [MEAL] on the enum `ScanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScanType_new" AS ENUM ('CHECK_IN', 'SESSION');
ALTER TABLE "Scan" ALTER COLUMN "type" TYPE "ScanType_new" USING ("type"::text::"ScanType_new");
ALTER TABLE "Assignment" ALTER COLUMN "type" TYPE "ScanType_new" USING ("type"::text::"ScanType_new");
ALTER TYPE "ScanType" RENAME TO "ScanType_old";
ALTER TYPE "ScanType_new" RENAME TO "ScanType";
DROP TYPE "ScanType_old";
COMMIT;
