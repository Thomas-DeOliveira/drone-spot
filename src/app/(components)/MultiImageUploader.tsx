"use client";

import * as React from "react";

type MultiImageUploaderProps = {
  name: string;
  required?: boolean;
  accept?: string;
  className?: string;
  onFilesChange?: (count: number) => void;
};

type Entry = {
  id: string;
  file?: File;
  previewUrl?: string;
};

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|gif|avif|heic|heif)$/i;
const MAX_FILE_MB = 10;
const MAX_TOTAL_MB = 25;

export default function MultiImageUploader({ name, required, accept = "image/*", className, onFilesChange }: MultiImageUploaderProps) {
  const [entries, setEntries] = React.useState<Entry[]>([{ id: crypto.randomUUID() }]);
  const [error, setError] = React.useState<string>("");
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  React.useEffect(() => {
    return () => {
      entries.forEach((e) => e.previewUrl && URL.revokeObjectURL(e.previewUrl));
    };
  }, [entries]);

  const getAllFiles = (list: Entry[]) => list.map((e) => e.file).filter(Boolean) as File[];

  React.useEffect(() => {
    const count = getAllFiles(entries).length;
    onFilesChange?.(count);
  }, [entries, onFilesChange]);

  const validateSizes = (files: File[]): string | null => {
    const tooBigFile = files.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBigFile) return `Chaque image doit faire moins de ${MAX_FILE_MB} Mo.`;
    const total = files.reduce((acc, f) => acc + f.size, 0);
    if (total > MAX_TOTAL_MB * 1024 * 1024) return `La taille totale des images dépasse ${MAX_TOTAL_MB} Mo. Réduisez/compressez vos images.`;
    return null;
  };

  const handlePick = (id: string) => {
    inputRefs.current[id]?.click();
  };

  const handleChange = (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { id } : e)));
      return;
    }
    const isImage = (file as any).type?.startsWith("image/") || ALLOWED_EXT.test(file.name || "");
    if (!isImage || file.size <= 0) {
      const msg = "Seules les images sont autorisées (jpg, jpeg, png, webp, gif, avif, heic, heif).";
      setError(msg);
      inputRefs.current[id] && (inputRefs.current[id]!.value = "");
      setEntries((prev) => prev.map((e) => (e.id === id ? { id } : e)));
      return;
    }

    const nextList = entries.map((e) => ({ ...e }));
    const idx = nextList.findIndex((e) => e.id === id);
    if (idx >= 0) {
      if (nextList[idx].previewUrl) URL.revokeObjectURL(nextList[idx].previewUrl!);
      nextList[idx].file = file;
      nextList[idx].previewUrl = URL.createObjectURL(file);
    }

    const all = getAllFiles(nextList);
    const sizeErr = validateSizes(all);
    if (sizeErr) {
      setError(sizeErr);
      if (idx >= 0) {
        if (nextList[idx].previewUrl) URL.revokeObjectURL(nextList[idx].previewUrl!);
        nextList[idx] = { id };
        inputRefs.current[id] && (inputRefs.current[id]!.value = "");
      }
      setEntries(nextList);
      return;
    }
    setError("");
    setEntries(nextList);
  };

  const handleAddAnother = () => {
    const next = { id: crypto.randomUUID() } as Entry;
    setEntries((prev) => [...prev, next]);
    setTimeout(() => handlePick(next.id), 0);
  };

  const handleRemove = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      const all = getAllFiles(next);
      const sizeErr = validateSizes(all);
      if (sizeErr) setError(sizeErr); else setError("");
      const removed = prev.find((e) => e.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next.length > 0 ? next : [{ id: crypto.randomUUID() }];
    });
  };

  const setPrimary = (id: string) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx <= 0) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const hasAtLeastOne = entries.some((e) => e.file);

  return (
    <div className={className}>
      <div className="space-y-3">
        {entries.map((e, index) => (
          <div key={e.id} className="rounded-md border p-3 flex items-center gap-3">
            <input
              type="file"
              name={name}
              accept={accept}
              className="hidden"
              ref={(el) => (inputRefs.current[e.id] = el)}
              onChange={(ev) => handleChange(e.id, ev.currentTarget.files)}
              required={required && !hasAtLeastOne && index === 0}
            />
            <div className="w-20 h-16 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
              {e.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Aperçu</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{e.file?.name || "Aucune image"}</div>
              <div className="text-xs text-muted-foreground">
                {e.file ? `${(e.file.size / (1024 * 1024)).toFixed(2)} Mo` : ""}
                {index === 0 && e.file ? " • Principale" : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="h-8 px-2 rounded-md border bg-background text-sm"
                      onClick={() => handlePick(e.id)}>
                {e.file ? "Changer" : "Choisir"}
              </button>
              {e.file && index !== 0 && (
                <button type="button" className="h-8 px-2 rounded-md border bg-background text-sm"
                        onClick={() => setPrimary(e.id)}>
                  Définir comme principale
                </button>
              )}
              {e.file && (
                <button type="button" className="h-8 px-2 rounded-md border bg-background text-sm"
                        onClick={() => handleRemove(e.id)}>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {hasAtLeastOne && (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className="h-9 px-3 rounded-md border bg-background text-sm"
                  onClick={handleAddAnother}>
            Ajouter une autre image
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="mt-2 text-sm text-red-600">{error}</div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Conseil: sélectionnez votre photo principale puis ajoutez d'autres images. Taille maximale: {MAX_FILE_MB} Mo par image, {MAX_TOTAL_MB} Mo au total.
      </p>
    </div>
  );
}


