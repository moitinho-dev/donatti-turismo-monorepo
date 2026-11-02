-- CreateTable
CREATE TABLE "meta_connections" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "pageId" TEXT,
    "pageName" TEXT,
    "pageAccessToken" TEXT,
    "igUserId" TEXT,
    "igUsername" TEXT,
    "connectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "published_media" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "published_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "published_media_createdAt_idx" ON "published_media"("createdAt");
