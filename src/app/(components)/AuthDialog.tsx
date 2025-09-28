"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginError, setLoginError] = useState<string>("");
  const [registerError, setRegisterError] = useState<string>("");

  async function handleCredentialsSignIn(formData: FormData) {
    setLoginError("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      setActiveTab("login");
      setLoginError("Identifiants invalides. Veuillez réessayer.");
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  async function handleRegister(formData: FormData) {
    setRegisterError("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const resp = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    
    const data = await resp.json().catch(() => ({}));
    
    if (!resp.ok) {
      setActiveTab("register");
      setRegisterError(data?.error || "Inscription impossible. Veuillez vérifier les informations.");
      return;
    }
    
    // Afficher le message de succès avec information sur l'email
    if (data.emailSent) {
      setRegisterError(""); // Effacer les erreurs
      setActiveTab("register");
      // Afficher un message de succès dans l'onglet inscription
      setRegisterError(`✅ ${data.message}`);
    } else {
      setRegisterError(`⚠️ ${data.message}`);
    }
  }


  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/40 z-[5000]"
          onClick={() => onOpenChange(false)}
        />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border bg-card text-card-foreground p-4 shadow-lg z-[5001]">
          <Dialog.Title className="text-base font-medium mb-2">Bienvenue</Dialog.Title>
          <Tabs.Root value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setLoginError(""); setRegisterError(""); }}>
            <Tabs.List className="flex gap-2 border-b mb-3">
              <Tabs.Trigger value="login" className="px-3 py-1.5 text-sm data-[state=active]:border-b-2 data-[state=active]:border-foreground">Se connecter</Tabs.Trigger>
              <Tabs.Trigger value="register" className="px-3 py-1.5 text-sm data-[state=active]:border-b-2 data-[state=active]:border-foreground">Inscription</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="login">
              <form action={(fd) => startTransition(() => handleCredentialsSignIn(fd))} className="space-y-3">
                {loginError ? (
                  <div className="text-sm text-destructive">{loginError}</div>
                ) : null}
                <div className="space-y-1">
                  <label className="text-sm">Email</label>
                  <input name="email" type="email" required className="w-full border rounded px-3 py-2 bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Mot de passe</label>
                  <input name="password" type="password" required className="w-full border rounded px-3 py-2 bg-background" />
                </div>
                <button
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
                >
                  Se connecter
                </button>
                <div className="text-center">
                  <a
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Mot de passe oublié ?
                  </a>
                </div>
              </form>
            </Tabs.Content>
            <Tabs.Content value="register">
              <form action={(fd) => startTransition(() => handleRegister(fd))} className="space-y-3">
                {registerError ? (
                  <div className="text-sm text-destructive">{registerError}</div>
                ) : null}
                <div className="space-y-1">
                  <label className="text-sm">Nom</label>
                  <input name="name" type="text" className="w-full border rounded px-3 py-2 bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Email</label>
                  <input name="email" type="email" required className="w-full border rounded px-3 py-2 bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Mot de passe</label>
                  <input name="password" type="password" required className="w-full border rounded px-3 py-2 bg-background" />
                </div>
                <button
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
                >
                  Créer un compte
                </button>
              </form>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


