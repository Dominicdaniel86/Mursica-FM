/*
  Warnings:

  - You are about to drop the column `hostID` on the `Guest` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_hostID_fkey";

-- AlterTable
ALTER TABLE "Guest" DROP COLUMN "hostID",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CurrentSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrentSession_sessionId_key" ON "CurrentSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentSession_adminId_key" ON "CurrentSession"("adminId");

-- AddForeignKey
ALTER TABLE "CurrentSession" ADD CONSTRAINT "CurrentSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CurrentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
