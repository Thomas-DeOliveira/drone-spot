'use client';

import { useEffect, useMemo, useRef, useState } from "react";

type MapOption = { id: string; name: string; icon?: string | null };

type Props = {
  name: string;
  owned: MapOption[];
  shared: MapOption[];
  extra?: { label: string; maps: MapOption[] };
  preselectedIds?: string[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export default function MapMultiSelect({
  name,
  owned,
  shared,
  extra,
  preselectedIds = [],
  placeholder = "Sélectionnez des cartes…",
  label = "Cartes",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(preselectedIds);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedIds(Array.from(new Set(preselectedIds)));
  }, [preselectedIds]);

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

  const allSections = useMemo(() => {
    return [
      { label: "Mes cartes", maps: owned },
      { label: "Cartes partagées en écriture", maps: shared },
      ...(extra ? [extra] : []),
    ].filter((s) => s.maps && s.maps.length > 0);
  }, [owned, shared, extra]);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return allSections;
    const q = query.toLowerCase();
    return allSections
      .map((sec) => ({
        label: sec.label,
        maps: sec.maps.filter((m) => m.name.toLowerCase().includes(q)),
      }))
      .filter((s) => s.maps.length > 0);
  }, [allSections, query]);

  const selectedLookup = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function remove(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  const selectedMaps = useMemo(() => {
    const map = new Map<string, MapOption>();
    for (const s of allSections) {
      for (const m of s.maps) map.set(m.id, m);
    }
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as MapOption[];
  }, [allSections, selectedIds]);

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className={`w-full rounded-md border bg-background ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <div
          className="flex flex-wrap items-center gap-2 px-2 py-1 min-h-10 cursor-text"
          onClick={() => setOpen(true)}
        >
          {selectedMaps.length === 0 && (
            <span className="text-muted-foreground text-sm px-1">{placeholder}</span>
          )}
          {selectedMaps.map((m) => (
            <span key={m.id} className="flex items-center gap-1 text-sm bg-accent text-accent-foreground rounded px-2 py-1">
              <span>{m.icon ? m.icon : '✈️'}</span>
              <span className="max-w-[12rem] truncate">{m.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                className="ml-1 text-xs hover:opacity-80"
                aria-label={`Retirer ${m.name}`}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm px-1"
            placeholder={selectedMaps.length === 0 ? placeholder : "Rechercher…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>

        {open && (
          <div className="max-h-60 overflow-auto border-t">
            {filteredSections.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Aucun résultat</div>
            ) : (
              filteredSections.map((section) => (
                <div key={section.label} className="px-2 py-2">
                  <div className="text-xs text-muted-foreground mb-1 px-1">{section.label}</div>
                  {section.maps.map((m) => {
                    const checked = selectedLookup.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id)}
                        className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-accent ${checked ? 'bg-accent' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{m.icon ? m.icon : '✈️'}</span>
                          <span className="text-sm">{m.name}</span>
                        </div>
                        <input type="checkbox" className="pointer-events-none" readOnly checked={checked} />
                      </button>
                    );
                  })}
                </div>
              ))
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


