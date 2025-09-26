"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ForceLightTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
    // Bloque la bascule en retirant la classe dark si présente (hard safeguard)
    document.documentElement.classList.remove("dark");
  }, [setTheme]);
  return null;
}


