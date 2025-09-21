"use client";
import { useSession } from "next-auth/react";
import { useAuthErrorHandler } from "./hooks/useAuthError";
import { ReactNode } from "react";

interface AuthRequiredActionProps {
  children: ReactNode;
  fallback?: ReactNode;
  onAuthRequired?: () => void;
}

export default function AuthRequiredAction({ 
  children, 
  fallback = null, 
  onAuthRequired 
}: AuthRequiredActionProps) {
  const { data: session, status } = useSession();
  const { showAuthDialog } = useAuthErrorHandler();

  const handleClick = (e: React.MouseEvent) => {
    if (status === "loading") return; // En cours de chargement
    
    if (!session?.user) {
      e.preventDefault();
      e.stopPropagation();
      showAuthDialog();
      onAuthRequired?.();
      return;
    }
  };

  if (status === "loading") {
    return <>{fallback}</>;
  }

  if (!session?.user) {
    return (
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
