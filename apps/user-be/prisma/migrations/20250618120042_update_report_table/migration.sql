/*
  Warnings:

  - You are about to drop the column `content` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Report` table. All the data in the column will be lost.
  - Added the required column `datasetID` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "content",
DROP COLUMN "projectId",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "datasetID" TEXT NOT NULL,
ADD COLUMN     "reportHTML" TEXT,
ADD COLUMN     "reportPDF" TEXT;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_datasetID_fkey" FOREIGN KEY ("datasetID") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
