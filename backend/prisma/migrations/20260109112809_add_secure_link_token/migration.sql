/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `LinkToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `LinkToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LinkToken" ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LinkToken_token_key" ON "LinkToken"("token");
