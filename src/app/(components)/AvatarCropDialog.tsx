"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imageSrc: string; // DataURL ou URL locale
  onConfirm: (blob: Blob) => void;
  cropSize?: number; // Diamètre du cercle de crop (px)
}

export default function AvatarCropDialog({ open, onOpenChange, imageSrc, onConfirm, cropSize }: AvatarCropDialogProps) {
  const circleSize = cropSize ?? 96;
  const containerPx = Math.max(320, circleSize * 3);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(3);
  const lockEpsilonRef = useRef(0.05);

  useEffect(() => {
    // Charger l'image pour déterminer un minZoom qui permette de faire rentrer l'image entière dans le cercle
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || 1;
      const nh = img.naturalHeight || 1;
      // Zoom minimal pour tenter de faire rentrer l'image complète dans le cercle:
      // 1) contrainte bord court (pleinement visible sans rognage)
      const fitByMinSide = circleSize / Math.min(nw, nh);
      // 2) contrainte diagonale (rectangle entièrement dans le disque)
      const fitByDiag = circleSize / Math.sqrt(nw * nw + nh * nh);
      let computedMin = Math.max(0.05, Math.min(1, Math.min(fitByMinSide, fitByDiag * 1.05)));
      // Zoom max confortable
      const computedMax = Math.max(computedMin + 0.5, 4);
      setMinZoom(computedMin);
      setMaxZoom(computedMax);
      const z0 = Math.max(computedMin, Math.min(zoom, computedMax));
      setZoom(z0);
      setCrop({ x: 0, y: 0 });
      lockEpsilonRef.current = Math.max(0.01, computedMin * 0.06); // marge ~6% au-dessus du min
    };
    img.src = imageSrc;
  }, [imageSrc, circleSize, zoom]);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedArea) return;
    const canvas = document.createElement("canvas");
    // Exporter à la taille du cercle visuel pour correspondance exacte
    const destSize = circleSize;
    canvas.width = destSize;
    canvas.height = destSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Dessin du crop
      const scaleX = destSize / croppedArea.width;
      const scaleY = destSize / croppedArea.height;
      ctx.save();
      // Masque circulaire
      ctx.beginPath();
      ctx.arc(destSize / 2, destSize / 2, destSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        img,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
        0,
        0,
        croppedArea.width * scaleX,
        croppedArea.height * scaleY
      );
      ctx.restore();
      canvas.toBlob((blob) => {
        if (blob) onConfirm(blob);
      }, "image/jpeg", 0.92);
    };
    img.src = imageSrc;
  }, [croppedArea, circleSize, imageSrc, onConfirm]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[5500]" onClick={() => onOpenChange(false)} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-lg border bg-card text-card-foreground p-4 shadow-lg z-[5501]"
          onPointerDownOutside={() => onOpenChange(false)}
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-base font-medium">Recadrer la photo de profil</Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mx-auto" style={{ width: containerPx, height: containerPx }}>
            <div
              className="absolute rounded-full ring-1 ring-border z-10 pointer-events-none"
              style={{ width: circleSize, height: circleSize, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            />
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={(c) => {
                if (zoom <= minZoom + lockEpsilonRef.current) {
                  if (crop.x !== 0 || crop.y !== 0) setCrop({ x: 0, y: 0 });
                  return;
                }
                setCrop(c);
              }}
              onZoomChange={(z) => {
                setZoom(z);
                if (z <= minZoom + lockEpsilonRef.current) {
                  setCrop({ x: 0, y: 0 });
                }
              }}
              onCropComplete={onCropComplete}
              cropSize={{ width: circleSize, height: circleSize }}
              style={{
                containerStyle: { borderRadius: 12, overflow: "hidden", background: "var(--color-card)" },
                cropAreaStyle: { borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" },
                mediaStyle: { userSelect: "none" },
              } as any}
            />
          </div>

          {/* Contrôles */}
          <div className="mt-10 flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.001}
              value={zoom}
              onChange={(e) => {
                const z = Number(e.target.value);
                setZoom(z);
                if (z <= minZoom + lockEpsilonRef.current) {
                  setCrop({ x: 0, y: 0 });
                }
              }}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Astuce: position minimale = taille 100% (1:1).</div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center h-9 px-3 rounded-md border bg-background hover:bg-accent text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              Valider
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


