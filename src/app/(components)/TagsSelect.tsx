"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TagsSelect({ name, options, defaultValues, required }: { name: string; options: string[]; defaultValues?: string[]; required?: boolean }) {
  const [values, setValues] = React.useState<string[]>(defaultValues || []);
  const [showError, setShowError] = React.useState(false);
  const reqRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!required || !reqRef.current) return;
    if (values.length === 0) {
      reqRef.current.setCustomValidity("Sélectionnez au moins un tag.");
    } else {
      reqRef.current.setCustomValidity("");
      if (showError) setShowError(false);
    }
  }, [required, values.length, showError]);
  const display = values.length ? values.join(", ") : "Sélectionner...";
  return (
    <div className="space-y-2 relative">
      <input type="hidden" name={name} value={values.join(",")} />
      {/* Champ invisible pour la validation native du navigateur */}
      <input
        ref={reqRef}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute -z-10 opacity-0 pointer-events-none h-0 w-0"
        value={values.length > 0 ? "ok" : ""}
        onChange={() => {}}
        onInvalid={() => setShowError(true)}
        readOnly
        required={required}
      />
      <Select
        onValueChange={(v) => {
          setValues((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
        }}
     >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner...">
            <span className="truncate">{display}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={values.includes(opt)} readOnly className="h-3.5 w-3.5 rounded border" />
                <span>{opt}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Cliquez pour (dé)sélectionner plusieurs tags.</p>
      {required && values.length === 0 && showError && (
        <p className="text-xs text-red-600">Sélectionnez au moins un tag.</p>
      )}
    </div>
  );
}


