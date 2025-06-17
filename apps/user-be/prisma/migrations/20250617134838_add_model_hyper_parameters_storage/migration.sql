-- CreateTable
CREATE TABLE "ModelHyperParameters" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ModelHyperParameters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ModelHyperParameters" ADD CONSTRAINT "ModelHyperParameters_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
