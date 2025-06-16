/*
  Warnings:

  - You are about to drop the column `feature_engineering_context` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `feature_selection_context` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `profiling_context` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `training_context` on the `Dataset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataset" DROP COLUMN "feature_engineering_context",
DROP COLUMN "feature_selection_context",
DROP COLUMN "profiling_context",
DROP COLUMN "training_context",
ADD COLUMN     "selectedColumns" TEXT[];
