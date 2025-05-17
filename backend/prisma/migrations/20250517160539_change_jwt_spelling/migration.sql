/*
  Warnings:

  - You are about to drop the `JWT` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JWT" DROP CONSTRAINT "JWT_userId_fkey";

-- DropTable
DROP TABLE "JWT";

-- CreateTable
CREATE TABLE "Jwt" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jwt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jwt_token_key" ON "Jwt"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Jwt_userId_key" ON "Jwt"("userId");

-- AddForeignKey
ALTER TABLE "Jwt" ADD CONSTRAINT "Jwt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
