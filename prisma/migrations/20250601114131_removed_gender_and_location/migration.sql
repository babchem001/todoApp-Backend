/*
  Warnings:

  - You are about to drop the column `gender` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "gender",
DROP COLUMN "location";
