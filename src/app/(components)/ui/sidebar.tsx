"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export const SIDEBAR_COOKIE_NAME = "sidebar:open";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean | ((v: boolean) => boolean)) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  children,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const next = typeof value === "function" ? (value as any)(open) : value;
      if (onOpenChange) onOpenChange(next);
      else _setOpen(next);
      try {
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      } catch {}
    },
    [open, onOpenChange]
  );

  React.useEffect(() => {
    if (openProp !== undefined) return;
    try {
      const match = document.cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=([^;]+)`));
      if (match) {
        const v = match[1] === "true";
        _setOpen(v);
      }
    } catch {}
  }, [openProp]);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.");
  return ctx;
}

export function Sidebar({ className, children, collapsible = "icon" }: { className?: string; children: React.ReactNode; collapsible?: "icon" | "none" }) {
  const { open } = useSidebar();
  return (
    <aside
      data-state={open ? "open" : "collapsed"}
      data-collapsible={collapsible}
      className={cn(
        "group bg-sidebar text-sidebar-foreground border-sidebar-border border-r",
        "h-dvh sticky top-0 shrink-0 relative flex flex-col",
        "transition-[width] duration-200",
        open ? "w-64" : "w-16",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("h-14 flex items-center px-3 border-b border-sidebar-border", className)}>{children}</div>;
}

export function SidebarFooter({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("min-h-12 py-2 flex items-center px-3 border-t border-sidebar-border mt-auto", className)}>{children}</div>;
}

export function SidebarContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("p-2 overflow-y-auto flex-1 min-h-0", className)}>{children}</div>;
}

export function SidebarGroup({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("mb-2", className)}>{children}</div>;
}

export function SidebarGroupLabel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "px-2 text-xs font-medium text-sidebar-foreground/60 mb-1",
        "group-data-[state=collapsed]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarGroupContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

export function SidebarMenu({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <ul className={cn("grid gap-1", className)}>{children}</ul>;
}

export function SidebarMenuItem({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <li className={cn("list-none", className)}>{children}</li>;
}

export function SidebarMenuButton({
  asChild,
  className,
  children,
  isActive,
  tooltip,
}: {
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  tooltip?: string;
}) {
  const { open } = useSidebar();
  const Comp = asChild ? Slot : "button";
  const btn = (
    <Comp
      data-active={isActive ? "true" : undefined}
      className={cn(
        "group w-full inline-flex items-center gap-2 rounded-md",
        open ? "justify-start px-2" : "justify-center px-0",
        "py-1.5",
        "text-sm text-sidebar-foreground",
        "transition-colors duration-200 focus-visible:outline-none",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        className
      )}
    >
      {children}
    </Comp>
  );
  if (open || !tooltip) return btn;
  return (
    <Tooltip.Provider delayDuration={200} disableHoverableContent>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{btn}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="right" sideOffset={8} className="z-50 rounded-md bg-popover text-popover-foreground border border-border px-2 py-1 text-xs shadow-sm">
            {tooltip}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function SidebarSeparator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-sidebar-border my-2", className)} />;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1.5 rounded-md border",
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-4 w-4" />
      <span className="text-sm">Menu</span>
    </button>
  );
}

export function SidebarRail({ className }: { className?: string }) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "absolute right-0 top-0 h-8 w-6 m-2 rounded-md border",
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        "opacity-60 hover:opacity-100 transition",
        className
      )}
      aria-label={open ? "Réduire la sidebar" : "Déployer la sidebar"}
      title={open ? "Réduire" : "Déployer"}
    />
  );
}
