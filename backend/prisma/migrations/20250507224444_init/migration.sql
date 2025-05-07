/*
  Warnings:

  - Added the required column `updatedAt` to the `ClientToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OAuthToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `State` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClientToken" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "OAuthToken" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "State" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
