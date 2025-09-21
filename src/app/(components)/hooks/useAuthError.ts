"use client";
import { useAuthError } from "../providers/AuthErrorProvider";

export function useAuthErrorHandler() {
  const { showAuthDialog } = useAuthError();

  const handleAuthError = (error: any) => {
    // Vérifier si c'est une erreur d'authentification
    if (error?.message?.includes("signin") || 
        error?.status === 401 || 
        error?.status === 403 ||
        error?.message?.includes("unauthorized") ||
        error?.message?.includes("forbidden")) {
      showAuthDialog();
      return true; // Erreur gérée
    }
    return false; // Erreur non gérée
  };

  return { handleAuthError, showAuthDialog };
}
