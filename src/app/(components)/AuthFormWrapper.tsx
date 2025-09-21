"use client";
import { useAuthErrorHandler } from "./hooks/useAuthError";
import { useTransition, useState } from "react";

interface AuthFormWrapperProps {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export default function AuthFormWrapper({ action, children, className }: AuthFormWrapperProps) {
  const { handleAuthError } = useAuthErrorHandler();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setErrorMessage("");
    startTransition(async () => {
      try {
        await action(formData);
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
      {children}
    </form>
  );
}
