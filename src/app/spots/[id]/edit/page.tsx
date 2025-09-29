import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import DeleteImageConfirm from "@/app/(components)/DeleteImageConfirm";
import ClientValidator from "./ClientValidator";
import TagsSelect from "@/app/(components)/TagsSelect";
import MapMultiSelect from "@/app/(components)/MapMultiSelect";

type Props = { params: Promise<{ id: string }> };

export default async function EditSpotPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  const spot = await prisma.spot.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      latitude: true,
      longitude: true,
      mapId: true,
      userId: true,
      maps: { select: { mapId: true } },
      images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } },
      tags: { select: { name: true } },
    },
  });
  if (!spot) return notFound();
  if (spot.userId !== session.user.id) {
    // Autoriser si le spot appartient à une carte partagée en écriture avec l'utilisateur
    const shared = await prisma.mapShare.findFirst({
      where: {
        mapId: spot.mapId || "",
        role: "WRITE",
        OR: [
          { invitedUserId: session.user.id as string },
          { invitedEmail: (session.user.email as string) || "" },
        ],
      },
    });
    if (!shared) redirect(`/spots/${id}`);
  }

  const [allTags, ownedMaps, sharedWriteMapsRaw] = await Promise.all([
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.map.findMany({ where: { userId: session.user.id as string }, select: { id: true, name: true, icon: true }, orderBy: { createdAt: "desc" } }),
    prisma.mapShare.findMany({
      where: {
        role: "WRITE",
        OR: [
          { invitedUserId: session.user.id as string },
          { invitedEmail: (session.user.email as string) || "" },
        ],
      },
      select: { map: { select: { id: true, name: true, icon: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const sharedWriteMaps = sharedWriteMapsRaw.map((s) => s.map);
  const seen: Record<string, boolean> = {};
  const userMaps = [...ownedMaps, ...sharedWriteMaps].filter((m) => (seen[m.id] ? false : (seen[m.id] = true)));

  async function updateSpot(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const spotId = String(formData.get("spotId"));
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const selected = String(formData.get("tags") || "").split(",").map((v) => v.trim()).filter(Boolean);
    const mapsChecked = (formData.getAll("maps") as string[]).filter(Boolean);
    const targetMapIds = Array.from(new Set(mapsChecked));
    for (const mid of targetMapIds) {
      const m = await prisma.map.findUnique({ where: { id: mid }, select: { userId: true } });
      if (!m) throw new Error("Carte invalide");
      let allowed = m.userId === (s.user.id as string);
      if (!allowed) {
        const share = await prisma.mapShare.findFirst({
          where: {
            mapId: mid,
            role: "WRITE",
            OR: [
              { invitedUserId: s.user.id as string },
              { invitedEmail: (s.user.email as string) || "" },
            ],
          },
        });
        allowed = Boolean(share);
      }
      if (!allowed) throw new Error("Droit insuffisant sur la carte choisie");
    }
    if (!spotId) throw new Error("Spot invalide");
    if (!title) throw new Error("Le titre est requis");
    if (!description) throw new Error("La description est requise");
    if (selected.length === 0) throw new Error("Au moins un tag est requis");

    // Préparer images à supprimer et nouvelles images pour valider qu'il restera au moins une image
    const toDelete = (formData.getAll("deleteImages") as string[]).filter(Boolean);
    const allFiles = formData.getAll("images").filter(Boolean) as File[];
    const nonEmptyFiles = allFiles.filter((file) => Number((file as any)?.size || 0) > 0);
    const allowedExt = new Set(["jpg","jpeg","png","webp","gif","avif","heic","heif"]);
    const filteredUploads = nonEmptyFiles.filter((file) => {
      const size = Number((file as any)?.size || 0);
      if (size <= 0) return false;
      const mime = (file as any)?.type as string | undefined;
      if (mime && mime.startsWith("image/")) return true;
      const ext = (file.name?.split(".").pop() || "").toLowerCase();
      return allowedExt.has(ext);
    });
    if (nonEmptyFiles.length > 0 && filteredUploads.length === 0) {
      throw new Error("Seules les images sont autorisées (jpg, jpeg, png, webp, gif, avif, heic, heif)");
    }

    // Compter les images restantes après suppression et ajout
    const remainingCount = await prisma.spotImage.count({
      where: { spotId, NOT: { id: { in: toDelete } } },
    });
    if (remainingCount + filteredUploads.length <= 0) {
      throw new Error("Au moins une image est requise");
    }

    await prisma.spot.update({
      where: { id: spotId, userId: s.user.id as string },
      data: {
        title,
        description: description || null,
        tags: { set: selected.map((name) => ({ name })) },
        mapId: targetMapIds.length > 0 ? targetMapIds[0] : null,
      },
    });

    // Mettre à jour les liens multi-cartes: remplacement complet
    await prisma.spotMap.deleteMany({ where: { spotId } });
    if (targetMapIds.length > 0) {
      await prisma.spotMap.createMany({ data: targetMapIds.map((mid) => ({ spotId, mapId: mid })), skipDuplicates: true });
    }

    // Suppression d'images sélectionnées
    if (toDelete.length > 0) {
      const imgs = await prisma.spotImage.findMany({ where: { id: { in: toDelete }, spotId } });
      await prisma.spotImage.deleteMany({ where: { id: { in: toDelete }, spotId } });
      for (const img of imgs) {
        try {
          if (img.url.startsWith("/uploads/")) {
            const fpath = path.join(process.cwd(), "public", img.url.replace(/^\//, ""));
            await unlink(fpath).catch(() => {});
          }
        } catch {}
      }
    }

    if (filteredUploads.length > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const urls: string[] = [];
      for (const file of filteredUploads) {
        // @ts-ignore
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
      }
      if (urls.length > 0) {
        await prisma.spotImage.createMany({
          data: urls.map((url) => ({ spotId, url })),
        });
      }
    }

    redirect(`/spots/${spotId}`);
  }

  async function deleteSpot(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const spotId = String(formData.get("spotId"));
    if (!spotId) redirect("/spots");
    const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { userId: true, mapId: true } });
    if (!spot) redirect("/spots");
    // Autoriser suppression si propriétaire du spot, ou WRITE sur la carte du spot
    let canDelete = spot.userId === (s.user.id as string);
    if (!canDelete && spot.mapId) {
      const share = await prisma.mapShare.findFirst({
        where: {
          mapId: spot.mapId,
          role: "WRITE",
          OR: [
            { invitedUserId: s.user.id as string },
            { invitedEmail: (s.user.email as string) || "" },
          ],
        },
      });
      canDelete = Boolean(share);
    }
    if (!canDelete) redirect(`/spots/${spotId}`);
    const imgs = await prisma.spotImage.findMany({ where: { spotId } });
    await prisma.spot.delete({ where: { id: spotId } });
    for (const img of imgs) {
      try {
        if (img.url.startsWith("/uploads/")) {
          const fpath = path.join(process.cwd(), "public", img.url.replace(/^\//, ""));
          await unlink(fpath).catch(() => {});
        }
      } catch {}
    }
    redirect("/spots");
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-semibold mb-4">Modifier le spot</h1>
      <ClientValidator formId="edit-spot-form" existingImageCount={spot.images.length} />
      <form id="edit-spot-form" action={updateSpot} className="space-y-4">
        <input type="hidden" name="spotId" value={spot.id} />

        <div>
          <MapMultiSelect
            name="maps"
            label="Cartes"
            owned={ownedMaps as any}
            shared={sharedWriteMaps as any}
            preselectedIds={Array.from(new Set([spot.mapId || "", ...spot.maps.map((sm) => sm.mapId)]).values()).filter(Boolean) as string[]}
          />
          <p className="text-xs text-muted-foreground mt-1">Sélectionnez une ou plusieurs cartes.</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            name="title"
            defaultValue={spot.title}
            className="mt-1 w-full border rounded px-3 py-2 bg-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            defaultValue={spot.description || ""}
            className="mt-1 w-full border rounded px-3 py-2 bg-transparent"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <TagsSelect
            name="tags"
            options={allTags.map((t) => t.name)}
            defaultValues={spot.tags.map((t) => t.name)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Ajouter des images</label>
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            className="mt-1 w-full border rounded px-3 py-2 bg-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">Les images existantes restent conservées.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Images existantes</label>
          <div className="grid grid-cols-3 gap-3">
            {spot.images.map((img) => {
              const formId = `delete-img-${img.id}`;
              return (
                <div key={img.id} className="relative w-full aspect-[4/3] rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="image" className="h-full w-full object-cover" />
                  <DeleteImageConfirm formId={formId} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Enregistrer
          </button>
          <button
            form="delete-spot-form"
            type="submit"
            className="ml-auto inline-flex items-center px-4 py-2 rounded bg-destructive text-destructive-foreground hover:opacity-90"
          >
            Supprimer le spot
          </button>
        </div>
      </form>
      {/* Forms de suppression (hors du formulaire principal pour éviter l'imbrication) */}
      <div className="hidden">
        {spot.images.map((img) => {
          const formId = `delete-img-${img.id}`;
          return (
            <form key={img.id} id={formId} action={async () => {
              "use server";
              const s2 = await getServerSession(authOptions);
              if (!s2?.user?.id) redirect("/api/auth/signin");
              const imageId = img.id;
              const toDelete = await prisma.spotImage.findUnique({ where: { id: imageId } });
              if (toDelete && (await prisma.spot.findFirst({ where: { id: toDelete.spotId, userId: s2.user.id as string } }))) {
                await prisma.spotImage.delete({ where: { id: imageId } });
                if (toDelete.url.startsWith("/uploads/")) {
                  const fpath = path.join(process.cwd(), "public", toDelete.url.replace(/^\//, ""));
                  await unlink(fpath).catch(() => {});
                }
              }
              redirect(`/spots/${spot.id}/edit`);
            }} />
          );
        })}
        <form id="delete-spot-form" action={deleteSpot}>
          <input type="hidden" name="spotId" value={spot.id} />
        </form>
      </div>
    </div>
  );
}


