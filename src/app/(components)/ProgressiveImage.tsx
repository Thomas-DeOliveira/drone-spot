"use client";
import * as React from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string; // applied to container (back-compat) and images for object-fit
  imgClassName?: string; // override for image class
  sizes?: string;
  lowQuality?: number; // 1-100
  highQuality?: number; // 1-100
};

export default function ProgressiveImage({ src, alt, fill, width, height, className, imgClassName, sizes, lowQuality = 10, highQuality = 60 }: Props) {
  const [highLoaded, setHighLoaded] = React.useState(false);
  const imageClass = imgClassName ?? className;

  return (
    <div className={className} style={{ position: fill ? "absolute" : undefined, inset: fill ? 0 : undefined }}>
      {/* Low-res version pixelisée */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        quality={lowQuality}
        className={imageClass}
        style={{
          imageRendering: "pixelated",
          filter: "saturate(0.95)",
          transition: "opacity 300ms ease",
          opacity: highLoaded ? 0 : 1,
        }}
      />
      {/* High-res version qui se fond par-dessus */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        quality={highQuality}
        onLoad={() => setHighLoaded(true)}
        className={imageClass}
        style={{
          transition: "opacity 300ms ease",
          opacity: highLoaded ? 1 : 0,
        }}
      />
    </div>
  );
}


