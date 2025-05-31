-- AlterTable
ALTER TABLE "Attribute" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "featureEngineeringFile" TEXT,
ADD COLUMN     "featureSelectionFile" TEXT,
ADD COLUMN     "trainingFile" TEXT,
ADD COLUMN     "trainingType" "TrainingType";
