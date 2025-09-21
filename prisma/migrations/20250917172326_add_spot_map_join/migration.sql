-- CreateTable
CREATE TABLE "public"."SpotMap" (
    "spotId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotMap_pkey" PRIMARY KEY ("spotId","mapId")
);

-- AddForeignKey
ALTER TABLE "public"."SpotMap" ADD CONSTRAINT "SpotMap_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "public"."Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpotMap" ADD CONSTRAINT "SpotMap_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "public"."Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
