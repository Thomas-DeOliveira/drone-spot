"use client";

import { useEffect } from "react";
import { useSimpleToast } from "@/app/(components)/Toast";

export default function ClientUpdatedPing() {
  const { show, ToastHost } = useSimpleToast();
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("maps-updated"));
    const url = new URL(window.location.href);
    if (url.searchParams.get("updated") === "1") {
      show("Cartes mises à jour");
      url.searchParams.delete("updated");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  return <ToastHost />;
}


