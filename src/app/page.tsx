import { prisma } from "@/lib/prisma";
import MapViewClient from "./(components)/MapViewClient";

export default async function Home() {
  const [spots, tags] = await Promise.all([
    prisma.spot.findMany({
      where: {
        mapId: null,
        maps: { none: {} },
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
    prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  ]);

  return (
    <div className="w-full h-full overflow-hidden">
      <MapViewClient spots={spots as any} tags={tags} />
    </div>
  );
}
