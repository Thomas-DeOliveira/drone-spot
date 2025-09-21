import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MapViewClient from "@/app/(components)/MapViewClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const map = await prisma.map.findFirst({ where: { publicToken: token, linkPublic: true }, select: { name: true } });
  if (!map) return {} as any;
  return {
    title: `${map.name} – Carte publique` as any,
    robots: { index: false, follow: false },
  } as any;
}

export default async function PublicMapPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const map = await prisma.map.findFirst({ where: { publicToken: token, linkPublic: true }, select: { id: true, name: true } });
  if (!map) return notFound();

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

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="p-3 md:p-4 border-b shrink-0 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">{map.name}</h1>
          <p className="text-xs text-muted-foreground">Vue publique (lecture seule)</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <MapViewClient spots={spots as any} tags={tags} currentMapId={map.id} canCreate={false} />
      </div>
    </div>
  );
}


