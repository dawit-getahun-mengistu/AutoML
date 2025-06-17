/*
  Warnings:

  - You are about to drop the column `afterTrainingFile` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `trainingError` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `training_metadata` on the `Dataset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataset" DROP COLUMN "afterTrainingFile",
DROP COLUMN "trainingError",
DROP COLUMN "training_metadata";

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "trainingError" TEXT DEFAULT '',
ADD COLUMN     "trainingType" "TrainingType",
ADD COLUMN     "training_metadata" JSONB;
