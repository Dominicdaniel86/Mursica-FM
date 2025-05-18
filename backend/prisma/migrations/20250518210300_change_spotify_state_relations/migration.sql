/*
  Warnings:

  - You are about to drop the column `stateId` on the `OAuthToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `State` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `State` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OAuthToken" DROP CONSTRAINT "OAuthToken_stateId_fkey";

-- DropIndex
DROP INDEX "OAuthToken_stateId_key";

-- AlterTable
ALTER TABLE "OAuthToken" DROP COLUMN "stateId";

-- AlterTable
ALTER TABLE "State" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "State_userId_key" ON "State"("userId");

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
