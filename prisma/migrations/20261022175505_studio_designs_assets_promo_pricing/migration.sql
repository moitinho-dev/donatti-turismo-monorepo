-- AlterTable
ALTER TABLE "promos" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "valorOriginal" TEXT;

-- CreateTable
CREATE TABLE "designs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'design',
    "format" TEXT NOT NULL DEFAULT 'story',
    "data" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promoId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "prompt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "destino" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "designs_kind_format_idx" ON "designs"("kind", "format");

-- CreateIndex
CREATE INDEX "designs_promoId_idx" ON "designs"("promoId");

-- CreateIndex
CREATE INDEX "assets_createdAt_idx" ON "assets"("createdAt");

-- CreateIndex
CREATE INDEX "promos_campaign_idx" ON "promos"("campaign");

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
