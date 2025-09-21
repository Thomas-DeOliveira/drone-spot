'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

type Props = {
  formId: string;
  children?: React.ReactNode;
  confirmTitle?: string;
  confirmMessage: string;
  confirmButtonLabel?: string;
};

export default function ConfirmRotateLinkButton({ formId, children, confirmTitle = 'Régénérer le lien public', confirmMessage, confirmButtonLabel = 'Régénérer' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="h-9 px-3 rounded-md text-sm font-medium border bg-background hover:bg-accent ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {children || 'Régénérer le lien'}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[1000]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border bg-card text-card-foreground p-4 shadow-lg z-[1001]">
          <Dialog.Title className="text-base font-medium">{confirmTitle}</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
            {confirmMessage}
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                className="h-9 px-3 inline-flex items-center rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Annuler
              </button>
            </Dialog.Close>
            <button
              type="button"
              className="h-9 px-3 inline-flex items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => {
                const form = document.getElementById(formId) as HTMLFormElement | null;
                if (form) {
                  try { form.requestSubmit(); } catch { form.submit(); }
                  setOpen(false);
                }
              }}
            >
              {confirmButtonLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


