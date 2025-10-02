"use client";
import * as React from "react";

export default function ClientValidator({ formId, existingImageCount }: { formId: string; existingImageCount: number }) {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [serverError, setServerError] = React.useState<string>("");

  React.useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    // Lire une éventuelle erreur serveur dans l'URL (?error=...)
    try {
      const url = new URL(window.location.href);
      const err = url.searchParams.get("error");
      if (err) {
        setServerError(decodeURIComponent(err));
        // Nettoyer le paramètre pour éviter persistance
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {}
    function onSubmit(e: Event) {
      const formEl = (e.currentTarget || e.target) as HTMLFormElement;
      const list: string[] = [];
      const title = (formEl.querySelector('input[name="title"]') as HTMLInputElement | null)?.value.trim() || "";
      const description = (formEl.querySelector('textarea[name="description"]') as HTMLTextAreaElement | null)?.value.trim() || "";
      const tags = ((formEl.querySelector('input[name="tags"]') as HTMLInputElement | null)?.value || "").split(",").map((v) => v.trim()).filter(Boolean);
      const imagesInput = formEl.querySelector('input[name="images"]') as HTMLInputElement | null;
      const selectedFiles = Array.from((imagesInput?.files || []) as FileList);

      if (!title) list.push("Le titre est requis");
      if (!description) list.push("La description est requise");
      if (tags.length === 0) list.push("Au moins un tag est requis");
      if (existingImageCount <= 0 && selectedFiles.length === 0) {
        list.push("Au moins une image est requise");
      }

      // Règles de taille: 10 Mo par fichier, 25 Mo au total
      const MAX_FILE_MB = 10;
      const MAX_TOTAL_MB = 25;
      const tooBigFile = selectedFiles.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
      const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
      const tooBigTotal = totalBytes > MAX_TOTAL_MB * 1024 * 1024;
      if (tooBigFile) list.push(`Chaque image doit faire moins de ${MAX_FILE_MB} Mo.`);
      if (tooBigTotal) list.push(`La taille totale des images dépasse ${MAX_TOTAL_MB} Mo. Réduisez/compressez vos images.`);

      if (list.length > 0) {
        e.preventDefault();
        setErrors(list);
        // Optionnel: scroll vers le haut du formulaire
        formEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setErrors([]);
      }
    }
    form.addEventListener("submit", onSubmit as EventListener);
    return () => {
      const f = document.getElementById(formId) as HTMLFormElement | null;
      if (f) f.removeEventListener("submit", onSubmit as EventListener);
    };
  }, [formId, existingImageCount]);

  if (errors.length === 0 && !serverError) return null;
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
      <div className="font-medium mb-1">Merci de corriger les erreurs suivantes:</div>
      <ul className="list-disc pl-5 space-y-1">
        {serverError && <li>{serverError}</li>}
        {errors.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </div>
  );
}


