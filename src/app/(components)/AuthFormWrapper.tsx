"use client";
import { useAuthErrorHandler } from "./hooks/useAuthError";
import { useTransition, useState, useEffect } from "react";

interface AuthFormWrapperProps {
  action: (formData: FormData) => Promise<any>;
  children: React.ReactNode;
  className?: string;
}

export default function AuthFormWrapper({ action, children, className }: AuthFormWrapperProps) {
  const { handleAuthError } = useAuthErrorHandler();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Masquer automatiquement le message de succès après 3 secondes
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage("") , 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setErrorMessage("");
    setSuccessMessage("");
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && typeof result === "object") {
          if (result.error && typeof result.error === "string") {
            setErrorMessage(result.error);
            return;
          }
          if (result.redirectTo && typeof result.redirectTo === "string") {
            if (typeof window !== "undefined") {
              window.location.replace(result.redirectTo as string);
            }
            return;
          }
        }
        // Si pas de redirection ni d'erreur explicite, afficher un succès générique
        setSuccessMessage("Opération réussie !");
      } catch (error: any) {
        if (!handleAuthError(error)) {
          const msg = error?.message || "Une erreur est survenue. Merci de réessayer.";
          setErrorMessage(msg);
          console.error("Erreur non gérée:", error);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmitEvent} className={className} noValidate>
      {errorMessage && (
        <div role="alert" className="p-3 rounded-md border border-red-300 bg-red-50 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div role="status" className="p-3 rounded-md border border-green-300 bg-green-50 text-green-700 text-sm">
          ✅ {successMessage}
        </div>
      )}
      {isPending && (
        <div className="p-3 rounded-md border border-blue-300 bg-blue-50 text-blue-700 text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            Création du spot en cours…
          </div>
        </div>
      )}
      <fieldset disabled={isPending} className={isPending ? "opacity-75" : undefined}>
        {children}
      </fieldset>
    </form>
  );
}
