-- Drop foreign keys that conflict with the current in-memory auth IDs.
ALTER TABLE "Car" DROP CONSTRAINT IF EXISTS "Car_sellerId_fkey";
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_userId_fkey";
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_carId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_buyerId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_sellerId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_carId_fkey";
ALTER TABLE "Comparison" DROP CONSTRAINT IF EXISTS "Comparison_userId_fkey";
ALTER TABLE "ComparisonCar" DROP CONSTRAINT IF EXISTS "ComparisonCar_carId_fkey";

-- Keep persisted UUID primary keys, but store application-level user/car refs as text.
ALTER TABLE "Car" ALTER COLUMN "sellerId" TYPE TEXT USING "sellerId"::TEXT;
ALTER TABLE "Favorite" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "Favorite" ALTER COLUMN "carId" TYPE TEXT USING "carId"::TEXT;
ALTER TABLE "Question" ALTER COLUMN "buyerId" TYPE TEXT USING "buyerId"::TEXT;
ALTER TABLE "Question" ALTER COLUMN "sellerId" TYPE TEXT USING "sellerId"::TEXT;
ALTER TABLE "Question" ALTER COLUMN "carId" TYPE TEXT USING "carId"::TEXT;
ALTER TABLE "Comparison" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "ComparisonCar" ALTER COLUMN "carId" TYPE TEXT USING "carId"::TEXT;

-- Align Car columns with PublishedCarsRepository writes.
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT 'No especificado';
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "engine" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "power" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "torque" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "acceleration" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "topSpeed" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "consumption" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "dimensions" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserve existing auth data column from the previous migration.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT;
