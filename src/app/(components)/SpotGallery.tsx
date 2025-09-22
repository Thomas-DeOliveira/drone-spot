"use client";
import Image from "next/image";
import { useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type SpotGalleryProps = {
  title: string;
  images: { url: string }[];
};

export default function SpotGallery({ title, images }: SpotGalleryProps) {
  const hasImages = images && images.length > 0;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openLightbox = useCallback((idx: number) => {
    setIndex(idx);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  if (!hasImages) {
    return (
      <div className="h-40 border rounded flex items-center justify-center text-sm text-muted-foreground">
        Aucune image
      </div>
    );
  }

  const main = images[0].url;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => openLightbox(0)}
        className="relative w-full h-72 lg:h-96 rounded-xl overflow-hidden border focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Agrandir l'image"
      >
        <Image src={main} alt={title} fill className="object-cover" sizes="100vw" priority unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0" />
      </button>

      {lightboxOpen ? (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center">
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Fermer"
            className="absolute top-4 right-4 h-10 w-10 inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Précédent"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Suivant"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <div className="relative w-[90vw] max-w-5xl aspect-video">
            <Image
              src={images[index].url}
              alt={`${title} ${index + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}


