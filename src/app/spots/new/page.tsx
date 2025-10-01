// redirect supprimé: la navigation est gérée côté client via AuthFormWrapper
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import TagsSelect from "@/app/(components)/TagsSelect";
import Link from "next/link";
import ImageFileInputPreview from "@/app/(components)/ImageFileInputPreview";
import AuthRequiredAction from "@/app/(components)/AuthRequiredAction";
import AuthFormWrapper from "@/app/(components)/AuthFormWrapper";
import MapMultiSelect from "@/app/(components)/MapMultiSelect";

export const dynamic = "force-dynamic";

export default async function NewSpotPage({ searchParams }: { searchParams: Promise<{ lat?: string; lng?: string; mapId?: string }> }) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  const [allTags, ownedMaps, sharedWriteMapsRaw] = await Promise.all([
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    session?.user?.id
      ? prisma.map.findMany({ where: { userId: session.user.id as string }, select: { id: true, name: true, icon: true }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    session?.user?.id && session.user.email
      ? prisma.mapShare.findMany({
          where: {
            role: "WRITE",
            OR: [
              { invitedUserId: session.user.id as string },
              { invitedEmail: session.user.email as string },
            ],
          },
          select: { map: { select: { id: true, name: true, icon: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as any[]),
  ]);
  const sharedWriteMaps = (sharedWriteMapsRaw as any[]).map((s: any) => s.map);
  const seen: Record<string, boolean> = {};
  let userMaps = [...(ownedMaps as any[]), ...sharedWriteMaps].filter((m) => (seen[m.id] ? false : (seen[m.id] = true)));

  // S'il y a un mapId dans l'URL mais qu'il n'est pas dans la liste, on l'ajoute (si l'utilisateur a le droit WRITE)
  const preselectedMapId = resolvedSearchParams.mapId || "";
  let preselectedMap: { id: string; name: string; icon?: string | null } | null = null;
  if (preselectedMapId && !userMaps.find((m) => m.id === preselectedMapId) && session?.user?.id) {
    const m = await prisma.map.findUnique({ where: { id: preselectedMapId }, select: { id: true, name: true, icon: true, userId: true } });
    if (m) {
      const isOwner = m.userId === (session.user.id as string);
      let canWrite = isOwner;
      if (!canWrite) {
        const share = await prisma.mapShare.findFirst({
          where: {
            mapId: preselectedMapId,
            role: "WRITE",
            OR: [
              { invitedUserId: session.user.id as string },
              { invitedEmail: (session.user.email as string) || "" },
            ],
          },
        });
        canWrite = Boolean(share);
      }
      if (canWrite) {
        preselectedMap = { id: m.id, name: m.name, icon: m.icon };
        userMaps = [{ id: m.id, name: m.name, icon: m.icon }, ...userMaps];
      }
    }
  }
  
  // Récupérer les coordonnées depuis les paramètres URL
  const defaultLat = resolvedSearchParams.lat ? parseFloat(resolvedSearchParams.lat) : undefined;
  const defaultLng = resolvedSearchParams.lng ? parseFloat(resolvedSearchParams.lng) : undefined;

  async function createSpot(formData: FormData) {
    "use server";
    const sessionInner = await getServerSession(authOptions);
    if (!sessionInner?.user?.id) {
      return { error: "Authentification requise" };
    }
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const images = formData.getAll("images").filter(Boolean) as File[];
    const allowedExt = new Set(["jpg","jpeg","png","webp","gif","avif","heic","heif"]);
    const validImages = images.filter((file) => {
      // @ts-ignore
      if (!(file as any)?.size) return false;
      const mime = (file as any).type as string | undefined;
      if (mime && mime.startsWith("image/")) return true;
      const ext = (file.name?.split(".").pop() || "").toLowerCase();
      return allowedExt.has(ext);
    });
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const mapIdStr = String(formData.get("mapId") || resolvedSearchParams.mapId || "").trim();
    const mapsChecked = (formData.getAll("maps") as string[]).filter(Boolean);
    const selected = String(formData.get("tags") || "").split(",").map((v) => v.trim()).filter(Boolean);
    if (!title || !description || selected.length === 0 || validImages.length === 0 || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return { error: "Titre, description, au moins un tag, une image, latitude et longitude sont requis." };
    }

    // Si la création vise une carte, vérifier droit WRITE (propriétaire ou partagé en écriture)
    const targetMapIds = Array.from(new Set([mapIdStr, ...mapsChecked].filter(Boolean)));
    if (targetMapIds.length > 0) {
      const checkId = targetMapIds[0];
      const map = await prisma.map.findUnique({ where: { id: checkId }, select: { userId: true } });
      if (!map) return { error: "Carte introuvable" };
      const isOwner = map.userId === (sessionInner.user.id as string);
      let canWrite = isOwner;
      if (!canWrite) {
        const share = await prisma.mapShare.findFirst({
          where: {
            mapId: checkId,
            role: "WRITE",
            OR: [
              { invitedUserId: sessionInner.user.id as string },
              { invitedEmail: (sessionInner.user.email as string) || "" },
            ],
          },
        });
        canWrite = Boolean(share);
      }
      if (!canWrite) return { error: "Droit insuffisant pour ajouter un spot dans cette carte" };
    }
    const created = await prisma.spot.create({
      data: {
        title,
        description: description || null,
        latitude,
        longitude,
        mapId: mapIdStr || undefined,
        userId: sessionInner.user.id as string,
        tags: selected.length ? { connect: selected.map((name) => ({ name })) } : undefined,
      },
    });
    if (targetMapIds.length > 0) {
      await prisma.spotMap.createMany({
        data: targetMapIds.map((mid) => ({ spotId: created.id, mapId: mid as string })),
        skipDuplicates: true,
      });
    }
    // Sauvegarde locale des fichiers dans public/uploads et enregistrement des URLs
    if (validImages.length > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const urls: string[] = [];
      for (const file of validImages) {
        try {
          // ignorer fichiers vides
          // @ts-ignore File from formData has size
          if (!(file as any)?.size) continue;
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fallbackExt = (file as any).type?.split("/")[1] || "bin";
          const extRaw = (file.name?.split(".").pop() || fallbackExt).toLowerCase();
          const ext = allowedExt.has(extRaw) ? extRaw : "bin";
          const fname = `${randomUUID()}.${ext}`;
          const fpath = path.join(uploadsDir, fname);
          await writeFile(fpath, buffer);
          urls.push(`/uploads/${fname}`);
        } catch {}
      }
      if (urls.length > 0) {
        await prisma.spotImage.createMany({
          data: urls.map((url) => ({ spotId: created.id, url })),
        });
      }
    }
    if (mapIdStr) {
      return { redirectTo: `/maps/${mapIdStr}` };
    }
    if (targetMapIds.length > 0) {
      return { redirectTo: `/maps/${targetMapIds[0]}` };
    }
    return { redirectTo: "/" };
  }

  return (
    <AuthRequiredAction
      fallback={
        <div className="max-w-2xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ajouter un spot</h1>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto p-3 pb-24 md:p-6 md:pb-6 space-y-4 md:space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Ajouter un spot</h1>
          <p className="text-sm text-muted-foreground">Renseignez les informations du spot pour le partager avec la communauté.</p>
        {defaultLat && defaultLng && (
          <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary font-medium">
              📍 Coordonnées pré-remplies depuis la carte : {defaultLat.toFixed(6)}, {defaultLng.toFixed(6)}
            </p>
          </div>
        )}
        </div>

        <div className="rounded-xl border p-4 md:p-5 bg-card text-card-foreground shadow-sm">
        <AuthFormWrapper action={createSpot} className="space-y-5">
          {(userMaps.length > 0 || preselectedMap) && (
            <div className="space-y-2">
              <input type="hidden" name="mapId" value="" />
              <MapMultiSelect
                name="maps"
                label="Ajouter à des cartes (optionnel)"
                owned={Array.isArray(ownedMaps) ? ownedMaps as any : []}
                shared={Array.isArray(sharedWriteMaps) ? sharedWriteMaps as any : []}
                extra={preselectedMap && !ownedMaps.find((m: any) => m.id === preselectedMap!.id) && !sharedWriteMaps.find((m: any) => m.id === preselectedMap!.id)
                  ? { label: "Cette carte", maps: [preselectedMap] }
                  : undefined}
                preselectedIds={[resolvedSearchParams.mapId || ""].filter(Boolean)}
                placeholder="Sélectionnez des cartes…"
              />
              <p className="text-xs text-muted-foreground">Sélectionnez une ou plusieurs cartes. Si aucune, le spot sera public.</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Titre</label>
            <input
              type="text"
              name="title"
              className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ex. Colline du Vent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              className="w-full min-h-24 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Quelques mots sur l’accès, la vue, les précautions…"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Tags</label>
            <TagsSelect name="tags" options={allTags.map((t) => t.name)} required />
            <p className="sr-only">
              {/* Champ virtuel pour permettre au navigateur de détecter l'obligation via contrainte personnalisée */}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="48.8566"
                defaultValue={defaultLat}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="2.3522"
                defaultValue={defaultLng}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Images</label>
            <ImageFileInputPreview name="images" required />
            <p className="text-xs text-muted-foreground">Vous pouvez sélectionner plusieurs images.</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
            >
              Enregistrer
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-9 px-4"
            >
              Annuler
            </Link>
          </div>
        </AuthFormWrapper>
        </div>
      </div>
    </AuthRequiredAction>
  );
}


