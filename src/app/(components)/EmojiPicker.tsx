"use client";

import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Emoji = { char: string; name?: string };

function useEmojiList() {
  const [emojis, setEmojis] = React.useState<Emoji[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const cached = typeof window !== "undefined" ? localStorage.getItem("emoji_list_v1") : null;
        if (cached) {
          const arr = JSON.parse(cached) as Emoji[];
          if (!ignore) setEmojis(arr);
          setLoading(false);
          return;
        }
        const res = await fetch("https://unpkg.com/emoji.json@13.1.0/emoji.json", { cache: "force-cache" });
        const json = await res.json();
        // json is array with fields { codes, char, name, category }
        const arr: Emoji[] = (json as any[]).map((e) => ({ char: e.char, name: e.name }));
        if (!ignore) setEmojis(arr);
        localStorage.setItem("emoji_list_v1", JSON.stringify(arr));
      } catch {
        // fallback minimal set
        const arr: Emoji[] = "😀😃😄😁😆😅😂🙂😉😊😍😘😜🤓🧐😎🥳🤩🤠🤗🤔😴😷🤒🤕🤧🤮🤢💀👻🤖🎃😺😸😹😻😼😽🙀😿😾".split("").map((c) => ({ char: c }));
        if (!ignore) setEmojis(arr);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);
  return { emojis, loading };
}

export default function EmojiPicker({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const { emojis, loading } = useEmojiList();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>(defaultValue || "");
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!q) return emojis;
    const qq = q.toLowerCase();
    return emojis.filter((e) => (e.name || "").toLowerCase().includes(qq));
  }, [emojis, q]);

  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={value} />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-9 w-14 inline-flex items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition"
            aria-label="Choisir un emoji"
            title="Choisir un emoji"
          >
            <span className="text-xl leading-none">{value || "😀"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={6} className="w-64 p-2">
          <input
            className="mb-2 w-full h-8 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Rechercher..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {loading ? (
            <div className="text-xs text-muted-foreground p-2">Chargement…</div>
          ) : (
            <div className="grid grid-cols-8 gap-1 max-h-56 overflow-auto">
              {filtered.map((e, idx) => (
                <button
                  key={`${e.char}-${idx}`}
                  type="button"
                  className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent"
                  onClick={() => { setValue(e.char); setOpen(false); }}
                  title={e.name}
                >
                  <span className="text-lg leading-none">{e.char}</span>
                </button>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {value && (
        <button
          type="button"
          className="h-9 px-2 text-xs rounded-md border bg-background hover:bg-accent"
          onClick={() => setValue("")}
        >
          Effacer
        </button>
      )}
    </div>
  );
}


