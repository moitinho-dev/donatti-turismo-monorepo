-- Instagram connection table
CREATE TABLE IF NOT EXISTS "instagram_connections" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "pageName" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_connections_pkey" PRIMARY KEY ("id")
);

-- Add instagramPostId column to promos
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "instagramPostId" TEXT;
