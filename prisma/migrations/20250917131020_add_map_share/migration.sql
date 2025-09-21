-- CreateTable
CREATE TABLE "public"."MapShare" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapShare_mapId_invitedEmail_key" ON "public"."MapShare"("mapId", "invitedEmail");

-- AddForeignKey
ALTER TABLE "public"."MapShare" ADD CONSTRAINT "MapShare_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "public"."Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
