-- CreateTable
CREATE TABLE "publish_logs" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "offerHash" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publish_logs_promoId_channel_idx" ON "publish_logs"("promoId", "channel");

-- CreateIndex
CREATE INDEX "publish_logs_createdAt_idx" ON "publish_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
