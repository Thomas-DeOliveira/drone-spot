import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmojiPicker from "@/app/(components)/EmojiPicker";
import ConfirmDeleteMapButton from "@/app/(components)/ConfirmDeleteMapButton";
import ConfirmRotateLinkButton from "@/app/(components)/ConfirmRotateLinkButton";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function EditMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  const map = await prisma.map.findUnique({ where: { id }, select: { id: true, name: true, icon: true, userId: true, linkPublic: true, publicToken: true } });
  if (!map) return notFound();
  const isOwner = map.userId === (session.user.id as string);
  let canEdit = isOwner;
  if (!canEdit) {
    const share = await prisma.mapShare.findFirst({
      where: {
        mapId: map.id,
        role: "WRITE",
        OR: [
          { invitedUserId: session.user.id as string },
          { invitedEmail: (session.user.email as string) || "" },
        ],
      },
    });
    canEdit = Boolean(share);
  }
  if (!canEdit) redirect("/maps");

  async function save(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const icon = String(formData.get("icon") || "").trim() || null;
    if (!id || !name) return;
    const m = await prisma.map.findUnique({ where: { id }, select: { userId: true } });
    if (!m) return;
    let allowed = m.userId === (s.user.id as string);
    if (!allowed) {
      const share = await prisma.mapShare.findFirst({
        where: {
          mapId: id,
          role: "WRITE",
          OR: [
            { invitedUserId: s.user.id as string },
            { invitedEmail: (s.user.email as string) || "" },
          ],
        },
      });
      allowed = Boolean(share);
    }
    if (!allowed) return;
    await prisma.map.update({ where: { id }, data: { name, icon } });
    revalidatePath("/maps");
    redirect(`/maps?updated=1`);
  }

  async function togglePublic(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const id = String(formData.get("id") || "");
    const enable = String(formData.get("enable") || "false").toLowerCase() === "true";
    if (!id) return;
    const m = await prisma.map.findUnique({ where: { id }, select: { userId: true, publicToken: true } });
    if (!m || m.userId !== (s.user.id as string)) return; // réservé au propriétaire
    const currentToken = m.publicToken;
    if (enable) {
      const token = currentToken || (await import("crypto")).randomBytes(16).toString("hex");
      await prisma.map.update({ where: { id }, data: { linkPublic: true, publicToken: token } });
    } else {
      await prisma.map.update({ where: { id }, data: { linkPublic: false } });
    }
    revalidatePath(`/maps/${id}/edit`);
    redirect(`/maps/${id}/edit`);
  }

  async function rotateLink(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const id = String(formData.get("id") || "");
    if (!id) return;
    const m = await prisma.map.findUnique({ where: { id }, select: { userId: true } });
    if (!m || m.userId !== (s.user.id as string)) return; // réservé au propriétaire
    const token = (await import("crypto")).randomBytes(16).toString("hex");
    await prisma.map.update({ where: { id }, data: { linkPublic: true, publicToken: token } });
    revalidatePath(`/maps/${id}/edit`);
    redirect(`/maps/${id}/edit`);
  }

  async function remove(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const id = String(formData.get("id") || "");
    if (!id) redirect("/maps");
    const m = await prisma.map.findUnique({ where: { id }, select: { userId: true } });
    // Suppression: réservée au propriétaire uniquement
    if (!m || m.userId !== (s.user.id as string)) redirect("/maps");
    // Détacher les spots liés via la jointure et via mapId
    await prisma.spotMap.deleteMany({ where: { mapId: id } });
    await prisma.spot.updateMany({ where: { mapId: id }, data: { mapId: null } });
    // Supprimer les spots orphelins: ceux qui n'ont plus aucun lien (mapId null et aucune jointure)
    const orphanSpots = await prisma.spot.findMany({ where: { mapId: null, maps: { none: {} }, userId: s.user.id as string }, select: { id: true } });
    if (orphanSpots.length > 0) {
      await prisma.spotImage.deleteMany({ where: { spotId: { in: orphanSpots.map((o) => o.id) } } });
      await prisma.spot.deleteMany({ where: { id: { in: orphanSpots.map((o) => o.id) } } });
    }
    await prisma.map.delete({ where: { id } });
    revalidatePath("/maps");
    redirect("/maps?updated=1");
  }

  return (
    <div className="max-w-xl mx-auto p-4 pb-24 md:p-6 md:pb-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold">Modifier la carte</h1>
        <p className="text-sm text-muted-foreground">Changez le nom et l’emoji d’affichage.</p>
      </div>
      <form action={save} className="rounded-xl border p-4 md:p-5 bg-card text-card-foreground space-y-4">
        <input type="hidden" name="id" value={map.id} />
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input name="name" defaultValue={map.name} required className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Emoji</label>
          <EmojiPicker name="icon" defaultValue={map.icon || ""} />
        </div>
        <div>
          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">Enregistrer</button>
        </div>
      </form>

      {isOwner && (
        <div className="rounded-xl border p-4 md:p-5 bg-card text-card-foreground space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Accès via lien</div>
              <div className="text-sm text-muted-foreground">Permettre la lecture à toute personne qui possède le lien.</div>
            </div>
            {map.linkPublic ? (
              <form action={togglePublic}>
                <input type="hidden" name="id" value={map.id} />
                <input type="hidden" name="enable" value="false" />
                <button
                  type="submit"
                  className="h-9 px-3 rounded-md text-sm font-medium border bg-green-600 text-white border-green-600 hover:bg-green-700"
                >
                  Désactiver
                </button>
              </form>
            ) : (
              <form action={togglePublic}>
                <input type="hidden" name="id" value={map.id} />
                <input type="hidden" name="enable" value="true" />
                <button
                  type="submit"
                  className="h-9 px-3 rounded-md text-sm font-medium border bg-background hover:bg-accent"
                >
                  Activer
                </button>
              </form>
            )}
          </div>
          {map.linkPublic && (
            <div className="space-y-2">
              <div className="text-sm">Lien public</div>
              <input
                readOnly
                value={`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/m/${map.publicToken}`}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              />
              <form id="rotate-link-form" action={rotateLink}>
                <input type="hidden" name="id" value={map.id} />
              </form>
              <ConfirmRotateLinkButton 
                formId="rotate-link-form"
                confirmTitle="Régénérer le lien public"
                confirmMessage={"Cela va invalider l'ancien lien public immédiatement.\n\nToute personne ayant l'ancien lien ne pourra plus accéder à cette carte. Vous devrez partager le nouveau lien.\n\nVoulez-vous continuer ?"}
                confirmButtonLabel="Régénérer"
              />
            </div>
          )}
        </div>
      )}

      <form id="delete-map-form" action={remove} className="rounded-xl border p-4 md:p-5 bg-card text-card-foreground space-y-3">
        <input type="hidden" name="id" value={map.id} />
        <div className="text-sm text-muted-foreground">
          Suppression de la carte: 
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>les spots liés uniquement à cette carte seront supprimés;</li>
            <li>les spots présents sur d'autres cartes resteront visibles sur ces cartes;</li>
            <li>les liens de partage et d'association seront retirés.</li>
          </ul>
        </div>
        <ConfirmDeleteMapButton
          formId="delete-map-form"
          confirmTitle="Supprimer la carte"
          confirmMessage="Cette action est définitive. Les spots n'appartenant qu'à cette carte seront supprimés. Continuer ?"
        />
      </form>
    </div>
  );
}


