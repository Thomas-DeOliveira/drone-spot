"use client";

import * as React from "react";

type Message = { id: number; text: string };

export function useSimpleToast() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const idRef = React.useRef(1);
  const show = React.useCallback((text: string) => {
    const id = idRef.current++;
    setMessages((m) => [...m, { id, text }]);
    setTimeout(() => setMessages((m) => m.filter((x) => x.id !== id)), 2500);
  }, []);
  const ToastHost = React.useCallback(() => (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[5000] space-y-2">
      {messages.map((m) => (
        <div key={m.id} className="px-3 py-2 rounded-md bg-foreground text-background text-sm shadow">
          {m.text}
        </div>
      ))}
    </div>
  ), [messages]);
  return { show, ToastHost } as const;
}


