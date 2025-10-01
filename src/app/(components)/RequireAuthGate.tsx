"use client";
import { useEffect, useRef } from "react";
import { useAuthError } from "./providers/AuthErrorProvider";
import { LogIn } from "lucide-react";

export default function RequireAuthGate() {
  const { showAuthDialog } = useAuthError();
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    showAuthDialog();
  }, [showAuthDialog]);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center gap-3">
      <h1 className="text-lg md:text-xl font-semibold">Authentification requise</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Cette carte est privée. Veuillez vous connecter pour y accéder.
      </p>
      <button
        type="button"
        onClick={showAuthDialog}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
      >
        <LogIn className="h-4 w-4" />
        <span>Se connecter</span>
      </button>
    </div>
  );
}


