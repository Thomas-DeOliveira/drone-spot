"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const MapViewDynamic = dynamic(() => import("./MapView").then(m => m.MapView) as Promise<ComponentType<any>>, {
  ssr: false,
});

interface MapViewClientProps {
  spots: any[];
  tags: Array<{ id: string; name: string }>;
  currentMapId?: string;
  canCreate?: boolean;
}

export default function MapViewClient({ spots, tags, currentMapId, canCreate = true }: MapViewClientProps) {
  return <MapViewDynamic spots={spots} tags={tags} currentMapId={currentMapId} canCreate={canCreate} />;
}


