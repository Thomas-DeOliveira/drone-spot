"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export default function DeleteImageConfirm({ formId }: { formId: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Supprimer l'image"
          className="absolute top-2 right-2 h-7 w-7 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:opacity-90 shadow"
        >
          <X className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[1000]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border bg-card text-card-foreground p-4 shadow-lg z-[1001]">
          <Dialog.Title className="text-base font-medium">Confirmer la suppression</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-1">
            Cette image sera définitivement supprimée du spot.
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="h-9 px-3 inline-flex items-center rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                Annuler
              </button>
            </Dialog.Close>
            <button form={formId} type="submit" className="h-9 px-3 inline-flex items-center rounded-md bg-destructive text-destructive-foreground hover:opacity-90">
              Supprimer
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


