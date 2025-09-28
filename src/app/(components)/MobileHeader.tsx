"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, List, Plus, Layers } from "lucide-react";
import Image from "next/image";
import AuthDialog from "./AuthDialog";
 
import ModeToggle from "./ModeToggle";

export default function MobileHeader() {
  const { open, setOpen } = useSidebar();
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navElevated, setNavElevated] = useState(false);
  const [userMaps, setUserMaps] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);
  const [sharedMaps, setSharedMaps] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [isMapsPickerOpen, setIsMapsPickerOpen] = useState(false);
  const mapsPickerRef = useRef<HTMLDivElement | null>(null);
  const mapsPickerButtonRef = useRef<HTMLButtonElement | null>(null);

  function openMenu() {
    setIsMenuOpen(true);
    setIsMapsPickerOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mobile-menu-toggle", { detail: { open: true } }));
    }
  }

  function closeMenu() {
    setIsMenuOpen(false);
    setIsMapsPickerOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mobile-menu-toggle", { detail: { open: false } }));
    }
  }
  useEffect(() => {
    // Élever la navbar après hydratation pour éviter tout mismatch SSR/CSR
    setNavElevated(true);
    function onDocMouseDown(e: MouseEvent) {
      if (!isMapsPickerOpen) return;
      const panel = mapsPickerRef.current;
      const btn = mapsPickerButtonRef.current;
      const target = e.target as Node;
      if (panel && panel.contains(target)) return;
      if (btn && btn.contains(target)) return;
      setIsMapsPickerOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isMapsPickerOpen]);


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
      <div className="flex items-center justify-between px-3 py-1.5 md:px-4 md:py-3 border-b bg-background">
        <div className="w-8 h-8" />

        <Link href="/" className="inline-flex items-center group">
          <span className="relative inline-flex h-10 w-10 lg:h-16 lg:w-16 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
            <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/30 opacity-30 blur-md scale-125" />
            <>
              <span className="ds-logo-light block">
                <Image
                  src="/dronespot.svg"
                  alt="DroneSpot"
                  width={36}
                  height={36}
                  className="h-8 w-8 lg:h-12 lg:w-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                  priority
                />
              </span>
              <span className="ds-logo-dark block">
                <Image
                  src="/dronespot-white.svg"
                  alt="DroneSpot"
                  width={36}
                  height={36}
                  className="h-8 w-8 lg:h-12 lg:w-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                  priority
                />
              </span>
            </>
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FlySpot
          </span>
        </Link>

        <div className="w-8 h-8" /> {/* Spacer pour centrer le titre */}
      </div>

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={closeMenu}>
          <div
            className="fixed inset-0 bg-background h-[100dvh] overflow-y-auto shadow-xl md:inset-y-0 md:right-0 md:left-auto md:w-96 md:max-w-[90vw] md:border-l"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background">
              <Link href="/" className="inline-flex items-center group" onClick={closeMenu}>
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-lg">
                  <span className="ds-logo-light block">
                    <Image src="/dronespot.svg" alt="DroneSpot" width={36} height={36} className="h-9 w-9" />
                  </span>
                  <span className="ds-logo-dark block">
                    <Image src="/dronespot-white.svg" alt="DroneSpot" width={36} height={36} className="h-9 w-9" />
                  </span>
                </span>
                <span className="ml-2 text-base font-semibold tracking-tight text-foreground">FlySpot</span>
              </Link>
              <div className="flex items-center gap-2">
                {pathname !== "/about" && <ModeToggle />}
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div>
              {/* Actions rapides */}
              <div className="p-4 border-b">
                <div className="grid grid-cols-3 gap-3">
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground p-3"
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-xs font-medium">Carte</span>
                  </Link>
                  <Link
                    href="/spots"
                    onClick={closeMenu}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground p-3"
                  >
                    <List className="w-5 h-5" />
                    <span className="text-xs font-medium">Liste</span>
                  </Link>
                  {session?.user ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        const m = location.pathname.match(/^\/maps\/([^\/\?]+)/);
                        if (m && m[1]) {
                          location.href = `/maps/${m[1]}?place=1&view=map`;
                          return;
                        }
                        if (location.pathname !== "/") {
                          location.href = "/?place=1";
                          return;
                        }
                        window.dispatchEvent(new CustomEvent("start-spot-placement"));
                      }}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground p-3"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs font-medium">Ajouter</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setAuthOpen(true);
                      }}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground p-3"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs font-medium">Ajouter</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation principale supprimée (doublon avec actions rapides) */}

              {session?.user && (
                <div className="p-4 border-t space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Cartes perso
                  </div>
                  <Link
                    href="/maps"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <List className="w-5 h-5" />
                    <span>Gérer mes cartes</span>
                  </Link>
                  {userMaps.map((m) => (
                    <Link
                      key={m.id}
                      href={`/maps/${m.id}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                      <span className="truncate">{m.name}</span>
                    </Link>
                  ))}
                  {sharedMaps.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Cartes partagées</div>
                      {sharedMaps.map((m) => (
                        <Link
                          key={m.id}
                          href={`/maps/${m.id}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
                <div className="p-4 border-t space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Compte
                  </div>
                  
                  {/* Info utilisateur */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground">
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
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Mon profil</span>
                  </Link>
                  
                  <Link
                    href="/account"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Paramètres</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      closeMenu();
                      signOut();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition-colors text-red-600"
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
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
      {/* Bottom tabbar (mobile only) */
      }
      {!isMenuOpen && (
        <nav
          className={`fixed bottom-0 inset-x-0 ${navElevated ? 'z-[4600]' : 'z-40'} border-t bg-background dark:bg-card rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.15)]`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="relative mx-auto max-w-screen-sm px-2 pt-2 pb-1">
            {/* FAB centré (client-only pour éviter mismatch SSR/CSR) */}
            {navElevated && (
              <button
                type="button"
                onClick={() => {
                  const m = location.pathname.match(/^\/maps\/([^\/\?]+)/);
                  if (m && m[1]) {
                    location.href = `/maps/${m[1]}?place=1&view=map`;
                    return;
                  }
                  if (location.pathname !== "/") {
                    location.href = "/?place=1";
                    return;
                  }
                  window.dispatchEvent(new CustomEvent("start-spot-placement"));
                }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 h-11 w-11 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg border border-border ring-1 ring-border transition z-20"
                aria-label="Ajouter un spot"
              >
                <Plus className="w-5 h-5 translate-y-[0.5px]" />
              </button>
            )}
            <div
              className={`mb-1 rounded-lg border border-border/60 bg-background text-foreground shadow-sm overflow-hidden transition-[opacity,transform,max-height] duration-150 ease-out will-change-[opacity,transform,max-height] relative z-10 ${
                isMapsPickerOpen ? "opacity-100 translate-y-0 scale-100 max-h-60" : "opacity-0 translate-y-1 scale-[0.995] max-h-0 pointer-events-none"
              }`}
              ref={mapsPickerRef}
              aria-hidden={!isMapsPickerOpen}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">Mes cartes</span>
                {session?.user ? (
                  <Link
                    href="/maps"
                    onClick={() => setIsMapsPickerOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Gérer
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMapsPickerOpen(false); setAuthOpen(true); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Gérer
                  </button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto p-2 pb-7 space-y-2">
                {session?.user ? (
                  <>
                    {userMaps.map((m) => (
                      <Link
                        key={m.id}
                        href={`/maps/${m.id}`}
                        onClick={() => setIsMapsPickerOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                        <span className="truncate">{m.name}</span>
                      </Link>
                    ))}
                    {sharedMaps.length > 0 && (
                      <div className="pt-1 space-y-2">
                        <div className="px-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Partagées</div>
                        {sharedMaps.map((m) => (
                          <Link
                            key={m.id}
                            href={`/maps/${m.id}`}
                            onClick={() => setIsMapsPickerOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                            <span className="truncate">{m.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {userMaps.length === 0 && sharedMaps.length === 0 && (
                      <div className="p-3 text-center">
                        <div className="text-sm text-muted-foreground mb-2">Aucune carte disponible</div>
                        <Link
                          href="/maps"
                          onClick={() => setIsMapsPickerOpen(false)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Créer une carte</span>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsMapsPickerOpen(false); setAuthOpen(true); }}
                    className="w-full inline-flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Se connecter</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/"
                onClick={closeMenu}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                  (pathname === "/" || pathname?.startsWith("/maps"))
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Carte</span>
              </Link>
              <Link
                href="/spots"
                onClick={closeMenu}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                  pathname?.startsWith("/spots")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-5 h-5" />
                <span>Liste</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMapsPickerOpen(v => !v)}
                ref={mapsPickerButtonRef}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                  isMapsPickerOpen || pathname === "/maps" || pathname?.startsWith("/maps/")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Mes cartes"
              >
                <Layers className="w-5 h-5" />
                <span>Mes cartes</span>
              </button>
              <button
                type="button"
                onClick={openMenu}
                className="flex flex-col items-center justify-center gap-1 py-2 text-xs text-foreground hover:text-accent-foreground"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5" />
                <span>Menu</span>
              </button>
            </div>
          </div>
        </nav>
      )}
      
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
