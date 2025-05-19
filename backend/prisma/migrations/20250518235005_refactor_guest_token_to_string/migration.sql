/*
  Warnings:

  - You are about to drop the `GuestToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[guestToken]` on the table `Guest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guestToken` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GuestToken" DROP CONSTRAINT "GuestToken_guestId_fkey";

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "guestToken" TEXT NOT NULL;

-- DropTable
DROP TABLE "GuestToken";

-- CreateIndex
CREATE UNIQUE INDEX "Guest_guestToken_key" ON "Guest"("guestToken");
