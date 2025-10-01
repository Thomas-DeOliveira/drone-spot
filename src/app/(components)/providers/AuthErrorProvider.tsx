"use client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import AuthDialog from "../AuthDialog";

interface AuthErrorContextType {
  showAuthDialog: () => void;
  hideAuthDialog: () => void;
}

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(undefined);

export function AuthErrorProvider({ children }: { children: ReactNode }) {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const showAuthDialog = useCallback(() => setIsAuthDialogOpen(true), []);
  const hideAuthDialog = useCallback(() => setIsAuthDialogOpen(false), []);

  return (
    <AuthErrorContext.Provider value={{ showAuthDialog, hideAuthDialog }}>
      {children}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </AuthErrorContext.Provider>
  );
}

export function useAuthError() {
  const context = useContext(AuthErrorContext);
  if (context === undefined) {
    throw new Error("useAuthError must be used within an AuthErrorProvider");
  }
  return context;
}
