"use client";
import Image from "next/image";

export default function LogoBrand({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={className}>
      <span className="ds-logo-light block">
        <Image
          src="/dronespot.svg"
          alt="FlySpot"
          width={size}
          height={size}
          priority
        />
      </span>
      <span className="ds-logo-dark block">
        <Image
          src="/dronespot-white.svg"
          alt="FlySpot"
          width={size}
          height={size}
          priority
        />
      </span>
    </span>
  );
}


