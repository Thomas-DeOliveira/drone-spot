"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "already_verified">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const alreadyVerified = searchParams.get("already_verified");
    const emailParam = searchParams.get("email");
    const customMessage = searchParams.get("message");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (success === "true") {
      setStatus("success");
      setMessage("Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.");
      // Rediriger vers la page d'accueil après 3 secondes
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else if (alreadyVerified === "true") {
      setStatus("already_verified");
      setMessage("Votre email a déjà été vérifié ! Vous pouvez vous connecter normalement.");
      // Rediriger vers la page d'accueil après 3 secondes
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } else if (error === "true") {
      setStatus("error");
      setMessage(customMessage || "Erreur lors de la vérification. Le lien peut être invalide ou expiré.");
    } else {
      setStatus("error");
      setMessage("Lien de vérification invalide.");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="mb-4">
            {status === "loading" && (
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
            {(status === "success" || status === "already_verified") && (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {(status === "error" || status === "expired") && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          <h1 className="text-xl font-semibold mb-2">
            {status === "loading" && "Vérification en cours..."}
            {status === "success" && "Email vérifié !"}
            {status === "already_verified" && "Email déjà vérifié"}
            {status === "error" && "Erreur de vérification"}
            {status === "expired" && "Lien expiré"}
          </h1>

          <p className="text-muted-foreground mb-4">{message}</p>
          
          {(status === "success" || status === "already_verified") && email && (
            <p className="text-sm text-muted-foreground mb-4">
              Email vérifié : <span className="font-medium">{email}</span>
            </p>
          )}

          {(status === "success" || status === "already_verified") && (
            <p className="text-sm text-muted-foreground">
              Vous allez être redirigé vers la page d'accueil...
            </p>
          )}

          {(status === "error" || status === "expired") && (
            <div className="space-y-2">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Retour à l'accueil
              </button>
              {status === "expired" && (
                <button
                  onClick={() => router.push("/?resend=true")}
                  className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-sm font-medium"
                >
                  Demander un nouveau lien
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
