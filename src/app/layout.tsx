import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "./(components)/ui/sidebar";
import AppSidebar from "./(components)/AppSidebar";
import MobileHeader from "./(components)/MobileHeader";
import SessionProviderClient from "./(components)/providers/SessionProviderClient";
import ThemeProviderClient from "./(components)/providers/ThemeProviderClient";
import { AuthErrorProvider } from "./(components)/providers/AuthErrorProvider";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlySpot",
  description: "FlySpot — Carte des spots de drone",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icon.svg?v=3", media: "(prefers-color-scheme: light)" },
    { rel: "icon", url: "/icon-dark.svg?v=3", media: "(prefers-color-scheme: dark)" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png?v=3", sizes: "180x180" },
    { rel: "apple-touch-icon-precomposed", url: "/apple-touch-icon.png?v=3", sizes: "180x180" },
  ],
  appleWebApp: {
    capable: true,
    title: "FlySpot",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const href = requestHeaders.get("x-url") || "http://localhost/";
  const url = new URL(href);
  const hideSidebar = url.pathname === "/about";
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProviderClient>
          <SessionProviderClient>
            <AuthErrorProvider>
              <SidebarProvider>
                <div className="flex">
                  {!hideSidebar && <AppSidebar />}
                  <main className="flex-1 h-dvh overflow-y-hidden flex flex-col">
                  <MobileHeader />
                  <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
                </main>
                </div>
              </SidebarProvider>
            </AuthErrorProvider>
          </SessionProviderClient>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
