-- Google Business Profile connection and post tracking
CREATE TABLE IF NOT EXISTS "google_business_connections" (
    "id" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accountName" TEXT,
    "locationName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_business_connections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "googleBusinessPostName" TEXT;

