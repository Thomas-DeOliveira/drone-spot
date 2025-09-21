"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Home, List, Menu as MenuIcon, ChevronLeft, LogIn, Plus, Settings, User, Edit3, LogOut, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "./ui/sidebar";
import ModeToggle from "./ModeToggle";
import AuthDialog from "./AuthDialog";
import { useState } from "react";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const baseItems = [
  { title: "Carte des spots", url: "/", icon: Home },
  { title: "Liste des spots", url: "/spots", icon: List },
];

const personalItems: any[] = [];

export default function AppSidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const user = data?.user;
  const { open, setOpen } = useSidebar();
  const [authOpen, setAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const displayName = (user?.name || user?.email || "Utilisateur") as string;
  const firstInitial = (displayName.trim().split(/\s+/)[0] || "U").charAt(0).toUpperCase();
  const currentMapId = (() => {
    if (!pathname) return undefined;
    const m = pathname.match(/^\/maps\/([^\/\?]+)/);
    return m?.[1];
  })();
  const [userMaps, setUserMaps] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);
  const [sharedMaps, setSharedMaps] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);

  useEffect(() => {
    let ignore = false;
    async function loadMaps() {
      try {
        const res = await fetch("/api/my-maps", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!ignore) setUserMaps(Array.isArray(json) ? json : []);
      } catch {}
      try {
        const res2 = await fetch("/api/shared-maps", { cache: "no-store" });
        if (!res2.ok) return;
        const json2 = await res2.json();
        if (!ignore) setSharedMaps(Array.isArray(json2) ? json2 : []);
      } catch {}
    }
    if (user) loadMaps(); else setUserMaps([]);
    return () => { ignore = true; };
  }, [user, pathname]);

  useEffect(() => {
    function onMapsUpdated() {
      if (!user) return;
      fetch("/api/my-maps", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((json) => setUserMaps(Array.isArray(json) ? json : []))
        .catch(() => {});
      fetch("/api/shared-maps", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((json) => setSharedMaps(Array.isArray(json) ? json : []))
        .catch(() => {});
    }
    window.addEventListener("maps-updated", onMapsUpdated);
    return () => window.removeEventListener("maps-updated", onMapsUpdated);
  }, [user]);

  const communityItems = React.useMemo(() => {
    return [...baseItems];
  }, []);

  const adminItems = React.useMemo(() => {
    if (user && (user as any).role === "ADMIN") {
      return [{ title: "Administration", url: "/admin", icon: Settings }];
    }
    return [];
  }, [user]);

  return (
    <Sidebar className="hidden lg:flex">
      <SidebarHeader className="px-3 py-3">
        {open ? (
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/20 p-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)] ring-1 ring-primary/30 transition-transform group-hover:scale-105">
                <Image src="/dronespot.svg" alt="DroneSpot" width={20} height={20} className="h-5 w-5" priority />
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">DroneSpot</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Réduire la sidebar"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md border bg-sidebar text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <button
              onClick={() => setOpen(true)}
              aria-label="Déployer la sidebar"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-sidebar text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-3">
        <div className="space-y-4">
        <SidebarGroup>
          {open && <SidebarGroupLabel>Spots publics</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.url} className="inline-flex items-center gap-2 px-2 py-2.5 rounded-md">
                        {"icon" in item && item.icon ? (
                          <item.icon className="h-4 w-4" />
                        ) : (
                          <span className="inline-block h-4 w-4 rounded-sm border" />
                        )}
                        <span className="group-data-[state=collapsed]:hidden transition-colors duration-200">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            {open && <SidebarGroupLabel>Cartes perso</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/maps"} tooltip="Gérer mes cartes">
                    <Link href="/maps" className="inline-flex items-center gap-2 px-2 py-2.5 rounded-md">
                      <List className="h-4 w-4" />
                      <span className="group-data-[state=collapsed]:hidden transition-colors duration-200 truncate max-w-[160px]">Gérer mes cartes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {userMaps.map((m) => {
                  const active = pathname === `/maps/${m.id}`;
                  return (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton asChild isActive={active} tooltip={m.name}>
                        <Link href={`/maps/${m.id}`} className="inline-flex items-center gap-2 px-2 py-2.5 rounded-md">
                          <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                          <span className="group-data-[state=collapsed]:hidden transition-colors duration-200 truncate max-w-[160px]">{m.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && sharedMaps.length > 0 && (
          <SidebarGroup>
            {open && <SidebarGroupLabel>Cartes partagées</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {sharedMaps.map((m) => {
                  const active = pathname === `/maps/${m.id}`;
                  return (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton asChild isActive={active} tooltip={m.name}>
                        <Link href={`/maps/${m.id}`} className="inline-flex items-center gap-2 px-2 py-2.5 rounded-md">
                          <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">{m.icon || "✈️"}</span>
                          <span className="group-data-[state=collapsed]:hidden transition-colors duration-200 truncate max-w-[160px]">{m.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Section spots perso supprimée */}

        {adminItems.length > 0 && (
          <SidebarGroup>
            {open && <SidebarGroupLabel>Administration</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link href={item.url} className="inline-flex items-center gap-2 px-2 py-2.5 rounded-md">
                          {"icon" in item && item.icon ? (
                            <item.icon className="h-4 w-4" />
                          ) : (
                            <span className="inline-block h-4 w-4 rounded-sm border" />
                          )}
                          <span className="group-data-[state=collapsed]:hidden transition-colors duration-200">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        

        {/* Bouton Ajouter un spot (vrai bouton) au bas de la liste */}
        <div className="mt-3">
          {open ? (
            user ? (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("start-spot-placement"));
                }}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un spot</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter un spot</span>
              </button>
            )
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                {user ? (
                  <SidebarMenuButton asChild tooltip="Ajouter un spot">
                    <button
                      type="button"
                      onClick={() => {
                        // Démarre le mode placement sur la carte via un événement global
                        window.dispatchEvent(new CustomEvent("start-spot-placement"));
                      }}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9"
                      aria-label="Ajouter un spot"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild tooltip="Ajouter un spot">
                    <button
                      type="button"
                      onClick={() => setAuthOpen(true)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9"
                      aria-label="Ajouter un spot"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {open ? (
          <div className="flex items-center w-full justify-between gap-2">
            {!user ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Se connecter</span>
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-10 px-3 gap-2 max-w-[240px]">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Photo de profil"
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background text-foreground text-[11px]">
                        {firstInitial}
                      </span>
                    )}
                    <span className="truncate">{displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <Edit3 className="mr-2 h-4 w-4" />
                      <span>Paramètres du compte</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-spots" className="flex items-center">
                      <List className="mr-2 h-4 w-4" />
                      <span>Mes spots</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2 w-full">
            <ModeToggle />
            {!user ? (
              <button
                onClick={() => setAuthOpen(true)}
                aria-label="Se connecter"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9"
              >
                <LogIn className="h-4 w-4" />
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={displayName}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium h-9 w-9 border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Photo de profil"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px]">{firstInitial}</span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <Edit3 className="mr-2 h-4 w-4" />
                      <span>Paramètres du compte</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-spots" className="flex items-center">
                      <List className="mr-2 h-4 w-4" />
                      <span>Mes spots</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </SidebarFooter>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </Sidebar>
  );
}


