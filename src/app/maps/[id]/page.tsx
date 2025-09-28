import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MapViewClient from "@/app/(components)/MapViewClient";
import ViewModeSwitch from "@/app/(components)/ViewModeSwitch";
import SpotsListClient from "@/app/spots/SpotsListClient";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function UserMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  const map = await prisma.map.findUnique({ where: { id }, select: { id: true, name: true, userId: true } });
  if (!map) return notFound();
  const isOwner = map.userId === (session.user.id as string);
  let canCreate = isOwner;
  if (map.userId !== (session.user.id as string)) {
    // Autoriser si partagé avec l'utilisateur courant (par email ou par userId)
    const shared = await prisma.mapShare.findFirst({
      where: {
        mapId: map.id,
        OR: [
          { invitedUserId: session.user.id as string },
          { invitedEmail: (session.user.email as string) || "" },
        ],
      },
    });
    if (!shared) redirect("/maps");
    // Droit de création si WRITE
    canCreate = shared.role === "WRITE";
  }

  // Pas d'actions de renommage/suppression ou déplacement ici (déplacées ailleurs)

  const [spots, tags] = await Promise.all([
    prisma.spot.findMany({
      where: {
        OR: [
          { mapId: map.id },
          { maps: { some: { mapId: map.id } } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        images: { select: { url: true }, take: 1, orderBy: { createdAt: "asc" } },
        tags: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  async function leaveMap(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const mapId = String(formData.get("mapId") || "");
    if (!mapId) redirect("/maps");
    // Le propriétaire ne peut pas "quitter" sa propre carte
    const m = await prisma.map.findUnique({ where: { id: mapId }, select: { userId: true } });
    if (!m) redirect("/maps");
    if (m.userId === (s.user.id as string)) redirect(`/maps/${mapId}`);
    await prisma.mapShare.deleteMany({
      where: {
        mapId,
        OR: [
          { invitedUserId: s.user.id as string },
          { invitedEmail: (s.user.email as string) || "" },
        ],
      },
    });
    redirect("/maps?updated=1");
  }

  // lire ?view=list|map côté serveur
  const requestHeaders = await headers();
  const url = new URL(requestHeaders.get("x-url") || `http://localhost/maps/${id}`);
  const view = url.searchParams.get("view") === "list" ? "list" : "map";

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="p-3 md:p-4 border-b shrink-0 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">{map.name}</h1>
          <p className="text-xs text-muted-foreground">Vos spots liés à cette carte</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeSwitch />
          {/* Bouton quitter déplacé vers la page Gérer mes cartes */}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "list" ? (
          <div className="h-full overflow-auto">
            <SpotsListClient spots={spots as any} tags={tags} showTitle={false} />
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden">
            <MapViewClient spots={spots as any} tags={tags} currentMapId={map.id} canCreate={canCreate} />
          </div>
        )}
      </div>
    </div>
  );
}


