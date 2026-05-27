CREATE TABLE "AIAnalysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "carId" UUID NOT NULL,
    "dataHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImageAnalysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "carId" UUID NOT NULL,
    "imageHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "images" TEXT[],
    "result" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIAnalysis_carId_idx" ON "AIAnalysis"("carId");
CREATE INDEX "AIAnalysis_dataHash_idx" ON "AIAnalysis"("dataHash");
CREATE INDEX "ImageAnalysis_carId_idx" ON "ImageAnalysis"("carId");
CREATE INDEX "ImageAnalysis_imageHash_idx" ON "ImageAnalysis"("imageHash");

ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImageAnalysis" ADD CONSTRAINT "ImageAnalysis_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
