import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SpotsListClient from "./SpotsListClient";

export const dynamic = "force-dynamic";

export default async function SpotsListPage() {
  const [spots, tags] = await Promise.all([
    prisma.spot.findMany({
      where: {
        mapId: null,
        maps: { none: {} },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        images: { select: { url: true }, take: 1 },
        user: { select: { name: true, email: true, image: true } },
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
    <SpotsListClient spots={spots} tags={tags} />
  );
}


