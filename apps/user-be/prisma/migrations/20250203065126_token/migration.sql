-- CreateTable
CREATE TABLE "RefreshToken" (
    "userId" INTEGER NOT NULL,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("userId")
);
