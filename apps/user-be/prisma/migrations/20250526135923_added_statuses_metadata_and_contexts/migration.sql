/*
  Warnings:

  - The values [JSON] on the enum `DatasetFormat` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'ANOMALY_DETECTION', 'TIME_SERIES_FORECASTING');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('CLASSICAL', 'NAS');

-- AlterEnum
BEGIN;
CREATE TYPE "DatasetFormat_new" AS ENUM ('CSV', 'EXCEL');
ALTER TABLE "Dataset" ALTER COLUMN "format" TYPE "DatasetFormat_new" USING ("format"::text::"DatasetFormat_new");
ALTER TYPE "DatasetFormat" RENAME TO "DatasetFormat_old";
ALTER TYPE "DatasetFormat_new" RENAME TO "DatasetFormat";
DROP TYPE "DatasetFormat_old";
COMMIT;

-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "featureEngineeringError" TEXT DEFAULT '',
ADD COLUMN     "featureEngineeringStatus" "ProcessStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "featureSelectionError" TEXT DEFAULT '',
ADD COLUMN     "featureSelectionStatus" "ProcessStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "feature_engineering_context" JSONB,
ADD COLUMN     "feature_engineering_metadata" JSONB,
ADD COLUMN     "feature_selection_context" JSONB,
ADD COLUMN     "feature_selection_metadata" JSONB,
ADD COLUMN     "llmError" TEXT DEFAULT '',
ADD COLUMN     "profilingError" TEXT DEFAULT '',
ADD COLUMN     "profilingStatus" "ProcessStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "profiling_context" JSONB,
ADD COLUMN     "profiling_metadata" JSONB,
ADD COLUMN     "trainingError" TEXT DEFAULT '',
ADD COLUMN     "trainingStatus" "ProcessStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "training_context" JSONB,
ADD COLUMN     "training_metadata" JSONB;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "taskType" "TaskType",
ADD COLUMN     "task_description" TEXT;
