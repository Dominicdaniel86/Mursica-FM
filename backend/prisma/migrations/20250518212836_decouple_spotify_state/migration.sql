/*
  Warnings:

  - You are about to drop the column `userId` on the `State` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "State" DROP CONSTRAINT "State_userId_fkey";

-- DropIndex
DROP INDEX "State_userId_key";

-- AlterTable
ALTER TABLE "State" DROP COLUMN "userId";
