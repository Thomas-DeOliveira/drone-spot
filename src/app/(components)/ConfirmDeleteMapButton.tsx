'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";

type Props = {
  formId: string;
  children?: React.ReactNode;
  confirmTitle?: string;
  confirmMessage: string;
};

export default function ConfirmDeleteMapButton({ formId, children, confirmTitle = 'Supprimer la carte', confirmMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const canSubmit = text.trim().toUpperCase() === "SUPPRIMER";

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 h-9 px-4">
          {children || 'Supprimer la carte'}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[1000]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border bg-card text-card-foreground p-4 shadow-lg z-[1001]">
          <Dialog.Title className="text-base font-medium">{confirmTitle}</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
            {confirmMessage}
          </Dialog.Description>
          <div className="mt-4 space-y-2">
            <label className="text-xs text-muted-foreground">Pour confirmer, tapez <span className="font-semibold text-foreground">SUPPRIMER</span> :</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="h-9 px-3 inline-flex items-center rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                Annuler
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={!canSubmit}
              className={`h-9 px-3 inline-flex items-center rounded-md bg-destructive text-destructive-foreground ${canSubmit ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
              onClick={() => {
                if (!canSubmit) return;
                const form = document.getElementById(formId) as HTMLFormElement | null;
                if (form) {
                  try { form.requestSubmit(); } catch { form.submit(); }
                  setOpen(false);
                }
              }}
            >
              Supprimer
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


