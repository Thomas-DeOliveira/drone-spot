import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SpotsListClient from "@/app/spots/SpotsListClient";

export const dynamic = "force-dynamic";

export default async function MySpotsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  const [spots, tags, ownedMaps, sharedAccess] = await Promise.all([
    prisma.spot.findMany({
      where: { userId: session.user.id as string },
      select: {
        id: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        images: { select: { url: true }, take: 1, orderBy: { createdAt: "asc" } },
        tags: { select: { id: true, name: true } },
        map: { select: { id: true, name: true, icon: true, userId: true } },
        maps: { select: { map: { select: { id: true, name: true, icon: true, userId: true } } } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.map.findMany({ where: { userId: session.user.id as string }, select: { id: true } }),
    prisma.mapShare.findMany({
      where: {
        OR: [
          { invitedUserId: session.user.id as string },
          { invitedEmail: (session.user.email as string) || "" },
        ],
      },
      select: { mapId: true },
    }),
  ]);

  const accessibleMapIds = new Set<string>([
    ...ownedMaps.map((m) => m.id),
    ...sharedAccess.map((s) => s.mapId),
  ]);

  const filteredSpotsWithFlag = spots.map((s) => {
    const hadAnyMap = Boolean(s.map) || (s.maps && s.maps.length > 0);
    const safePrimary = s.map && accessibleMapIds.has(s.map.id) ? s.map : null;
    const safeLinks = (s.maps || []).filter((sm) => accessibleMapIds.has(sm.map.id));
    return { ...s, map: safePrimary, maps: safeLinks, __hadAnyMap: hadAnyMap } as any;
  });

  // Masquer totalement les spots privés sans accès (conservés: publics ou avec au moins une carte accessible)
  const visibleSpots = filteredSpotsWithFlag.filter((s: any) => {
    const isPublic = !s.__hadAnyMap; // pas de cartes au départ => public
    const hasAccessible = Boolean(s.map) || (Array.isArray(s.maps) && s.maps.length > 0);
    return isPublic || hasAccessible;
  });

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="p-3 md:p-4 border-b shrink-0">
        <h1 className="text-lg md:text-xl font-semibold">Mes spots</h1>
        <p className="text-xs text-muted-foreground">Tous les spots que vous avez créés</p>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-auto">
          <SpotsListClient spots={visibleSpots as any} tags={tags} showMapBadges showTitle={false} />
        </div>
      </div>
    </div>
  );
}


