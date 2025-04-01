/*
  Warnings:

  - You are about to drop the column `hotelName` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `roomType` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentReference]` on the table `Accommodation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referenceCode]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hotelId` to the `Accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Accommodation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PriceCategory" AS ENUM ('ECONOMY', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_participantId_fkey";

-- AlterTable
ALTER TABLE "Accommodation" DROP COLUMN "hotelName",
DROP COLUMN "roomType",
DROP COLUMN "status",
ADD COLUMN     "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hotelId" TEXT NOT NULL,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "accreditationDate" TIMESTAMP(3),
ADD COLUMN     "dietaryRequirements" TEXT,
ADD COLUMN     "paymentAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentProof" TEXT,
ADD COLUMN     "referenceCode" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "location" TEXT,
ADD COLUMN     "notes" TEXT;

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "AccommodationStatus";

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "priceCategory" "PriceCategory" NOT NULL,
    "imageUrl" TEXT,
    "availableRooms" INTEGER NOT NULL DEFAULT 0,
    "distanceFromVenue" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "amenities" TEXT[],
    "contactPhone" TEXT,
    "contactWhatsapp" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "Config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Accommodation_paymentReference_key" ON "Accommodation"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_referenceCode_key" ON "Participant"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "Accommodation" ADD CONSTRAINT "Accommodation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
