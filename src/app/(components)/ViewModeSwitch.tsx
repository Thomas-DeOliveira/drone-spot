"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function ViewModeSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = (sp.get("view") || "map") as "map" | "list";

  const indicatorClass = useMemo(() => (
    current === "list" ? "translate-x-full" : "translate-x-0"
  ), [current]);

  function setView(view: "map" | "list") {
    const usp = new URLSearchParams(sp.toString());
    if (view === "map") usp.delete("view"); else usp.set("view", view);
    router.replace(`${pathname}${usp.toString() ? `?${usp.toString()}` : ""}`);
  }

  return (
    <div className="relative inline-flex items-center rounded-md border bg-background text-foreground shadow-sm select-none">
      <div className="grid grid-cols-2 relative">
        <div className={`absolute top-0 left-0 h-full w-1/2 rounded-md bg-accent transition-transform duration-200 ease-out ${indicatorClass}`} />
        <button
          type="button"
          onClick={() => setView("map")}
          className={`relative z-10 px-3 h-9 text-sm font-medium rounded-md ${current === "map" ? "text-accent-foreground" : "text-muted-foreground"}`}
          aria-pressed={current === "map"}
        >
          Carte
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`relative z-10 px-3 h-9 text-sm font-medium rounded-md ${current === "list" ? "text-accent-foreground" : "text-muted-foreground"}`}
          aria-pressed={current === "list"}
        >
          Liste
        </button>
      </div>
    </div>
  );
}


