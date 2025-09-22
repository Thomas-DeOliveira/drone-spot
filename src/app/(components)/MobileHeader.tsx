"use client";
import { useEffect, useState } from "react";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Home, List, Plus } from "lucide-react";
import Image from "next/image";
import AuthDialog from "./AuthDialog";
import { useTheme } from "next-themes";
import ModeToggle from "./ModeToggle";

export default function MobileHeader() {
  const { open, setOpen } = useSidebar();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMaps, setUserMaps] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);
  const [sharedMaps, setSharedMaps] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);
  const [authOpen, setAuthOpen] = useState(false);

  function openMenu() {
    setIsMenuOpen(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mobile-menu-toggle", { detail: { open: true } }));
    }
  }

  function closeMenu() {
    setIsMenuOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mobile-menu-toggle", { detail: { open: false } }));
    }
  }

  const navigationItems: Array<{ title: string; url?: string; icon: any; action?: "start-placement" }> = [
    { title: "Carte", url: "/", icon: Home },
    { title: "Liste", url: "/spots", icon: List },
  ];

  if (session?.user) {
    navigationItems.push({ title: "Ajouter un spot", action: "start-placement", icon: Plus });
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const r1 = await fetch("/api/my-maps", { cache: "no-store" });
        const j1 = r1.ok ? await r1.json() : [];
        if (!ignore) setUserMaps(Array.isArray(j1) ? j1 : []);
      } catch {}
      try {
        const r2 = await fetch("/api/shared-maps", { cache: "no-store" });
        const j2 = r2.ok ? await r2.json() : [];
        if (!ignore) setSharedMaps(Array.isArray(j2) ? j2 : []);
      } catch {}
    }
    if (session?.user) load(); else { setUserMaps([]); setSharedMaps([]); }
    return () => { ignore = true; };
  }, [session?.user]);

  useEffect(() => {
    function onMapsUpdated() {
      if (!session?.user) return;
      fetch("/api/my-maps", { cache: "no-store" }).then(r => r.ok ? r.json() : []).then(j => setUserMaps(Array.isArray(j) ? j : [])).catch(() => {});
      fetch("/api/shared-maps", { cache: "no-store" }).then(r => r.ok ? r.json() : []).then(j => setSharedMaps(Array.isArray(j) ? j : [])).catch(() => {});
    }
    window.addEventListener("maps-updated", onMapsUpdated);
    return () => window.removeEventListener("maps-updated", onMapsUpdated);
  }, [session?.user]);

  return (
    <div className="lg:hidden">
      {/* Header mobile */}
      <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b bg-background">
        <button
          onClick={openMenu}
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="inline-flex items-center group">
          <span className="relative inline-flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
            <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/30 opacity-30 blur-md scale-125" />
            <Image
              src={resolvedTheme === "dark" ? "/dronespot-white.svg" : "/dronespot.svg"}
              alt="DroneSpot"
              width={36}
              height={36}
              className="h-9 w-9 lg:h-12 lg:w-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
              priority
            />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            DroneSpot
          </span>
        </Link>

        <div className="w-9 h-9" /> {/* Spacer pour centrer le titre */}
      </div>

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={closeMenu}>
          <div
            className="fixed top-0 right-0 w-80 max-w-[85vw] bg-background border-l shadow-lg h-[100dvh] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div>
              {/* Navigation principale */}
              <nav className="p-4 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Navigation
                </div>
                {navigationItems.map((item, idx) => {
                  if (item.url) {
                    return (
                      <Link
                        key={`${item.title}-${idx}`}
                        href={item.url}
                        onClick={closeMenu}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  }
                  if (item.action === "start-placement") {
                    return (
                      <button
                        key={`${item.title}-${idx}`}
                        type="button"
                        onClick={() => {
                          closeMenu();
                          // Si on est sur une carte perso, rester sur cette carte et activer place=1
                          const m = location.pathname.match(/^\/maps\/([^\/\?]+)/);
                          if (m && m[1]) {
                            location.href = `/maps/${m[1]}?place=1&view=map`;
                            return;
                          }
                          // Depuis une autre vue, on va sur la carte générale avec place=1
                          if (location.pathname !== "/") {
                            location.href = "/?place=1";
                            return;
                          }
                          // Déjà sur la carte: déclenche le mode placement
                          window.dispatchEvent(new CustomEvent("start-spot-placement"));
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </button>
                    );
                  }
                  return null;
                })}
              </nav>

              {session?.user && (
                <div className="p-4 border-t space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Cartes perso
                  </div>
                  <Link
                    href="/maps"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <List className="w-5 h-5" />
                    <span>Gérer mes cartes</span>
                  </Link>
                  {userMaps.map((m) => (
                    <Link
                      key={m.id}
                      href={`/maps/${m.id}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                      <span className="truncate">{m.name}</span>
                    </Link>
                  ))}
                  {sharedMaps.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Cartes partagées</div>
                      {sharedMaps.map((m) => (
                        <Link
                          key={m.id}
                          href={`/maps/${m.id}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                          <span className="truncate">{m.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section utilisateur */}
              {session?.user ? (
                <div className="p-4 border-t">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Compte
                  </div>
                  
                  {/* Info utilisateur */}
                  <div className="flex items-center gap-3 p-3 mb-2">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt="Photo de profil"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {session.user.name || "Utilisateur"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Liens compte */}
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Mon profil</span>
                  </Link>
                  
                  <Link
                    href="/account"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Paramètres</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      closeMenu();
                      signOut();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      setAuthOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Se connecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
