/*
  Warnings:

  - You are about to drop the column `categoryId` on the `todos` table. All the data in the column will be lost.
  - You are about to drop the `_TodoToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TodoToUser" DROP CONSTRAINT "_TodoToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_TodoToUser" DROP CONSTRAINT "_TodoToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_userId_fkey";

-- DropForeignKey
ALTER TABLE "todos" DROP CONSTRAINT "todos_categoryId_fkey";

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "bio" DROP NOT NULL;

-- AlterTable
ALTER TABLE "todos" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "_TodoToUser";

-- DropTable
DROP TABLE "categories";

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
