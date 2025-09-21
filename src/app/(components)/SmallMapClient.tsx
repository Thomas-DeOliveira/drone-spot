"use client";
import dynamic from "next/dynamic";

const SmallMap = dynamic(() => import("@/app/(components)/SmallMap"), {
  ssr: false,
});

export default function SmallMapClient(props: { latitude: number; longitude: number; className?: string }) {
  return <SmallMap {...props} />;
}


