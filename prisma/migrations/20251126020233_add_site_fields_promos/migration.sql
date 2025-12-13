-- Add publication fields for site cards
ALTER TABLE "promos" ADD COLUMN "sitePublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "promos" ADD COLUMN "siteSection" TEXT;
ALTER TABLE "promos" ADD COLUMN "siteSlug" TEXT;
ALTER TABLE "promos" ADD COLUMN "siteImage" TEXT;
ALTER TABLE "promos" ADD COLUMN "siteDescription" TEXT;
ALTER TABLE "promos" ADD COLUMN "siteInclusions" TEXT[] DEFAULT '{}'::text[];
ALTER TABLE "promos" ADD COLUMN "siteDepartures" TEXT[] DEFAULT '{}'::text[];

-- Ensure slugs are unique when provided
CREATE UNIQUE INDEX "promos_siteSlug_key" ON "promos"("siteSlug");
