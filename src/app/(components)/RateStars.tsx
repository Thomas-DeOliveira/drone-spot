"use client";
import { useOptimistic, useState } from "react";

type Props = {
  initial: number;
  onRate: (value: number) => Promise<void> | void;
  disabled?: boolean;
};

export default function RateStars({ initial, onRate, disabled }: Props) {
  const [value, setValue] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [pending, setPending] = useState(false);

  async function handleClick(v: number) {
    if (disabled || pending) return;
    setOptimistic(v);
    setPending(true);
    try {
      await onRate(v);
      setValue(v);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`Noter ${i}`}
          onClick={() => handleClick(i)}
          className={`h-6 w-6 ${disabled ? "opacity-50 cursor-default" : "cursor-pointer"}`}
        >
          <svg viewBox="0 0 20 20" className={`h-6 w-6 ${i <= optimistic ? "fill-yellow-400" : "fill-muted"}`}>
            <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
          </svg>
        </button>
      ))}
      {pending ? <span className="ml-2 text-xs text-muted-foreground">…</span> : null}
    </div>
  );
}


