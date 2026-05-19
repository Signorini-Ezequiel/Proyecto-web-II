-- DropIndex
DROP INDEX "Car_brand_model_idx";

-- DropIndex
DROP INDEX "Car_createdAt_idx";

-- DropIndex
DROP INDEX "Car_fuelType_idx";

-- DropIndex
DROP INDEX "Car_isPublished_deletedAt_idx";

-- DropIndex
DROP INDEX "Car_location_idx";

-- DropIndex
DROP INDEX "Car_price_idx";

-- DropIndex
DROP INDEX "Car_sellerId_idx";

-- DropIndex
DROP INDEX "Car_transmission_idx";

-- DropIndex
DROP INDEX "Car_year_idx";

-- DropIndex
DROP INDEX "Comparison_createdAt_idx";

-- DropIndex
DROP INDEX "Comparison_userId_idx";

-- DropIndex
DROP INDEX "ComparisonCar_carId_idx";

-- DropIndex
DROP INDEX "Favorite_carId_idx";

-- DropIndex
DROP INDEX "Favorite_userId_carId_key";

-- DropIndex
DROP INDEX "Favorite_userId_idx";

-- DropIndex
DROP INDEX "Question_buyerId_idx";

-- DropIndex
DROP INDEX "Question_carId_idx";

-- DropIndex
DROP INDEX "Question_createdAt_idx";

-- DropIndex
DROP INDEX "Question_sellerId_idx";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "Car" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);
