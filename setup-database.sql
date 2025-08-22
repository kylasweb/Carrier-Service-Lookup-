-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "carrierType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerServices" TEXT,
    "carrierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Port" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "unloc" TEXT NOT NULL,
    "code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Port_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRoute" (
    "id" TEXT NOT NULL,
    "polId" TEXT NOT NULL,
    "podId" TEXT NOT NULL,
    "pol" TEXT,
    "pod" TEXT,
    "transitTime" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRoute_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Carrier_name_key" ON "Carrier"("name");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Port_unloc_key" ON "Port"("unloc");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRoute" ADD CONSTRAINT "ServiceRoute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRoute" ADD CONSTRAINT "ServiceRoute_polId_fkey" FOREIGN KEY ("polId") REFERENCES "Port"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRoute" ADD CONSTRAINT "ServiceRoute_podId_fkey" FOREIGN KEY ("podId") REFERENCES "Port"("id") ON UPDATE CASCADE;
