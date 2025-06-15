/*
  Warnings:

  - You are about to drop the column `featureEngineeringFile` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `featureSelectionFile` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `profilingFile` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `trainingFile` on the `Dataset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataset" DROP COLUMN "featureEngineeringFile",
DROP COLUMN "featureSelectionFile",
DROP COLUMN "profilingFile",
DROP COLUMN "trainingFile",
ADD COLUMN     "afterFeatureEngineeringFile" TEXT,
ADD COLUMN     "afterFeatureSelectionFile" TEXT,
ADD COLUMN     "afterProfilingFile" TEXT,
ADD COLUMN     "afterTrainingFile" TEXT,
ADD COLUMN     "featureEngineeringCode" TEXT,
ADD COLUMN     "featureTransformationCode" TEXT,
ADD COLUMN     "targetColumnName" TEXT;
