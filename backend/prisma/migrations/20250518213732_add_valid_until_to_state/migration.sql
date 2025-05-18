/*
  Warnings:

  - Added the required column `validUntil` to the `State` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "State" ADD COLUMN     "validUntil" TIMESTAMP(3) NOT NULL;
