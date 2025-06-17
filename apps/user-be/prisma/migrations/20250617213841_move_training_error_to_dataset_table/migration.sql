/*
  Warnings:

  - You are about to drop the column `trainingError` on the `Model` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "trainingError" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "trainingError";
