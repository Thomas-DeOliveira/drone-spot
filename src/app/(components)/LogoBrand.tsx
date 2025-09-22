"use client";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function LogoBrand({ size = 56, className = "" }: { size?: number; className?: string }) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? "/dronespot-white.svg" : "/dronespot.svg";
  return (
    <Image src={src} alt="DroneSpot" width={size} height={size} className={`${className}`} priority />
  );
}


