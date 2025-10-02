"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  name: string;
  options: string[];
  defaultValues?: string[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
};

// Composant pour la page de modification (avec gestion des valeurs par défaut)
export default function TagMultiSelect({
  name,
  options,
  defaultValues = [],
  placeholder = "Sélectionnez des tags…",
  label = "Tags",
  disabled = false,
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() => Array.from(new Set(defaultValues)));
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Mémoriser une signature stable des valeurs par défaut pour éviter les boucles
  const lastAppliedDefaultsSigRef = useRef<string>(JSON.stringify(Array.from(new Set(defaultValues)).sort()));

  useEffect(() => {
    const normalized = Array.from(new Set(defaultValues));
    const sig = JSON.stringify([...normalized].sort());
    if (sig !== lastAppliedDefaultsSigRef.current) {
      lastAppliedDefaultsSigRef.current = sig;
      setSelectedIds(normalized);
    }
  }, [defaultValues]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLookup = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(tag: string) {
    setSelectedIds((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

  function remove(tag: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== tag));
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className={`w-full rounded-md border bg-background ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <div
          className="flex flex-wrap items-center gap-2 px-3 py-2 min-h-12 cursor-text transition-all duration-200 hover:bg-accent/50"
          onClick={() => setOpen(true)}
        >
          {selectedIds.length === 0 && (
            <span className="text-muted-foreground text-sm px-1">{placeholder}</span>
          )}
          {selectedIds.map((tag) => (
            <span key={tag} className="flex items-center gap-2 text-sm bg-accent text-accent-foreground rounded-md px-3 py-1.5 shadow-sm">
              <span className="max-w-[12rem] truncate">{tag}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(tag); }}
                className="ml-1 text-xs hover:opacity-80"
                aria-label={`Retirer ${tag}`}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm px-1"
            placeholder={selectedIds.length === 0 ? placeholder : "Rechercher…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
              }
            }}
          />
        </div>

        {open && (
          <div className="max-h-64 overflow-auto border-t bg-popover shadow-lg">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Aucun résultat</div>
            ) : (
              filtered.map((tag, index) => {
                const checked = selectedLookup.has(tag);
                return (
                  <div key={tag} className={index > 0 ? "border-t border-border/50" : ""}>
                    <button
                      type="button"
                      onClick={() => toggle(tag)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors ${checked ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{tag}</span>
                      </div>
                      <input type="checkbox" className="pointer-events-none" readOnly checked={checked} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Champs cachés pour le POST */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}

// Composant pour la page de création (plus simple, pas de gestion des valeurs par défaut)
export function TagMultiSelectNew({
  name,
  options,
  placeholder = "Sélectionnez des tags…",
  label = "Tags",
  disabled = false,
  required = false,
}: Omit<Props, 'defaultValues'>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLookup = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(tag: string) {
    setSelectedIds((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

  function remove(tag: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== tag));
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className={`w-full rounded-md border bg-background ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <div
          className="flex flex-wrap items-center gap-2 px-3 py-2 min-h-12 cursor-text transition-all duration-200 hover:bg-accent/50"
          onClick={() => setOpen(true)}
        >
          {selectedIds.length === 0 && (
            <span className="text-muted-foreground text-sm px-1">{placeholder}</span>
          )}
          {selectedIds.map((tag) => (
            <span key={tag} className="flex items-center gap-2 text-sm bg-accent text-accent-foreground rounded-md px-3 py-1.5 shadow-sm">
              <span className="max-w-[12rem] truncate">{tag}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(tag); }}
                className="ml-1 text-xs hover:opacity-80"
                aria-label={`Retirer ${tag}`}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm px-1"
            placeholder={selectedIds.length === 0 ? placeholder : "Rechercher…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
              }
            }}
          />
        </div>

        {open && (
          <div className="max-h-64 overflow-auto border-t bg-popover shadow-lg">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Aucun résultat</div>
            ) : (
              filtered.map((tag, index) => {
                const checked = selectedLookup.has(tag);
                return (
                  <div key={tag} className={index > 0 ? "border-t border-border/50" : ""}>
                    <button
                      type="button"
                      onClick={() => toggle(tag)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors ${checked ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{tag}</span>
                      </div>
                      <input type="checkbox" className="pointer-events-none" readOnly checked={checked} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Champs cachés pour le POST */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}


