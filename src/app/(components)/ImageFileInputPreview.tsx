"use client";

import * as React from "react";

type Props = {
  name: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
  required?: boolean;
};

export default function ImageFileInputPreview({ name, accept = "image/*", multiple = true, className, required }: Props) {
  const [previews, setPreviews] = React.useState<Array<{ url: string; name: string }>>([]);
  const [error, setError] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // cleanup object URLs
  React.useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const files = Array.from(inputEl.files || []);
    // revoke old urls
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    const validFiles = files.filter((f) => {
      if (!f || f.size === 0) return false;
      const typeOk = (f as any).type && (f as any).type.startsWith("image/");
      const name = (f.name || "").toLowerCase();
      const extOk = /\.(jpg|jpeg|png|webp|gif|avif|heic|heif)$/.test(name);
      return typeOk || extOk;
    });
    const invalidCount = files.length - validFiles.length;

    if (validFiles.length === 0) {
      const msg = "Seules les images sont autorisées (jpg, jpeg, png, webp, gif, avif, heic, heif).";
      setError(msg);
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.setCustomValidity(msg);
        inputRef.current.reportValidity();
      }
      setPreviews([]);
      return;
    }

    // Il y a au moins une image valide → on accepte, mais on prévient si certains fichiers ont été ignorés
    if (inputRef.current) {
      inputRef.current.setCustomValidity("");
    }
    setError(invalidCount > 0 ? `${invalidCount} fichier(s) non image ont été ignorés.` : "");

    const next = validFiles.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setPreviews(next);
  };

  return (
    <div className={className}>
      <input
        type="file"
        name={name}
        multiple={multiple}
        accept={accept}
        onChange={onChange}
        required={required}
        ref={inputRef}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-border file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
      />
      {error && (
        <div role="alert" aria-live="polite" className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {previews.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((p, idx) => (
            <div key={`${p.url}-${idx}`} className="relative w-full aspect-[4/3] rounded-md overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}


