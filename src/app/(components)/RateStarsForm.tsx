"use client";
import { useRef, useState } from "react";

type Props = {
  initial: number;
  action: (formData: FormData) => void;
  disabled?: boolean;
};

export default function RateStarsForm({ initial, action, disabled }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [optimistic, setOptimistic] = useState(initial);
  const [pending, setPending] = useState(false);

  async function handleClick(v: number) {
    if (disabled || pending) return;
    setOptimistic(v);
    setPending(true);
    try {
      if (inputRef.current && formRef.current) {
        inputRef.current.value = String(v);
        // @ts-ignore requestSubmit exists in modern browsers
        formRef.current.requestSubmit ? formRef.current.requestSubmit() : formRef.current.submit();
      }
    } finally {
      setTimeout(() => setPending(false), 300);
    }
  }

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input ref={inputRef} type="hidden" name="value" defaultValue={String(initial || 0)} />
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
      </div>
      {pending ? <span className="ml-2 text-xs text-muted-foreground">…</span> : null}
    </form>
  );
}


