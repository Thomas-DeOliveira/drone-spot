"use client";

import * as React from "react";
import MultiImageUploader from "@/app/(components)/MultiImageUploader";

type SpotImage = { id: string; url: string };

export default function EditImagesSection({ spotId, images }: { spotId: string; images: SpotImage[] }) {
  const [hasNew, setHasNew] = React.useState(false);

  return (
    <div>
      <label className="block text-sm font-medium">Ajouter des images</label>
      <MultiImageUploader name="images" onFilesChange={(count) => setHasNew(count > 0)} />
      <p className="text-xs text-muted-foreground mt-1">Les images existantes restent conservées.</p>

      {images.length > 0 && (
        <div className="mt-3 space-y-3">
          {images.map((img, idx) => {
            const isPrimary = idx === 0;
            const deleteFormId = `delete-img-${img.id}`;
            const setPrimaryFormId = `set-primary-${img.id}`;
            return (
              <div key={img.id} className="rounded-md border p-3 flex items-center gap-3">
                <div className="w-20 h-16 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="image" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">Image existante</div>
                  <div className="text-xs text-muted-foreground">{isPrimary ? "Principale" : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" form={setPrimaryFormId} className="h-8 px-2 rounded-md border bg-background text-sm">
                    {isPrimary ? "Principale" : "Définir comme principale"}
                  </button>
                  <button type="submit" form={deleteFormId} className="h-8 px-2 rounded-md bg-destructive text-destructive-foreground text-sm hover:opacity-90">
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


