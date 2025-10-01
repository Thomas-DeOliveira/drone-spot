import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ClientUpdatedPing from "@/app/maps/updated-ping";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmojiPicker from "@/app/(components)/EmojiPicker";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export default async function MapsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  async function createMap(formData: FormData) {
    "use server";
    const sessionInner = await getServerSession(authOptions);
    if (!sessionInner?.user?.id) redirect("/");
    const name = String(formData.get("name") || "").trim();
    const userIcon = String(formData.get("icon") || "").trim();
    const icon = userIcon ? userIcon : "✈️"; // Icône par défaut
    if (!name) return;
    await prisma.map.create({ data: { name, icon, userId: sessionInner.user.id as string } });
    revalidatePath("/maps");
    redirect("/maps?updated=1");
  }

  async function renameMap(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const icon = String(formData.get("icon") || "").trim() || null;
    if (!id || !name) return;
    const m = await prisma.map.findUnique({ where: { id }, select: { userId: true } });
    if (!m || m.userId !== (s.user.id as string)) return;
    await prisma.map.update({ where: { id }, data: { name, icon } });
  }

  async function deleteMap(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const id = String(formData.get("id") || "");
    if (!id) return;
    const m = await prisma.map.findUnique({ where: { id }, select: { userId: true } });
    if (!m || m.userId !== (s.user.id as string)) return;
    await prisma.spot.updateMany({ where: { mapId: id }, data: { mapId: null } });
    await prisma.map.delete({ where: { id } });
  }

  const maps = await prisma.map.findMany({
    where: { userId: session.user.id as string },
    select: { id: true, name: true, icon: true, createdAt: true, linkPublic: true },
    orderBy: { createdAt: "desc" },
  });

  const sharedMaps = await prisma.mapShare.findMany({
    where: {
      OR: [
        { invitedUserId: session.user.id as string },
        { invitedEmail: (session.user.email as string) || "" },
      ],
    },
    select: { map: { select: { id: true, name: true, icon: true, createdAt: true, linkPublic: true } } },
    orderBy: { createdAt: "desc" },
  });

  async function leaveSharedMap(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const mapId = String(formData.get("mapId") || "");
    if (!mapId) return;
    await prisma.mapShare.deleteMany({
      where: {
        mapId,
        OR: [
          { invitedUserId: s.user.id as string },
          { invitedEmail: (s.user.email as string) || "" },
        ],
      },
    });
    revalidatePath("/maps");
    redirect("/maps?updated=1");
  }

  async function shareMap(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const mapId = String(formData.get("mapId") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!mapId || !email) return;
    const map = await prisma.map.findUnique({ where: { id: mapId }, select: { userId: true } });
    if (!map || map.userId !== (s.user.id as string)) return;
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.mapShare.upsert({
      where: { mapId_invitedEmail: { mapId, invitedEmail: email } },
      create: { mapId, invitedEmail: email, invitedUserId: user?.id || null },
      update: { invitedUserId: user?.id || null },
    });
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const link = `${baseUrl}/maps/${mapId}`;
      await sendEmail({
        to: email,
        subject: "Une carte vous a été partagée sur FlySpot",
        html: `<p>Bonjour,</p><p>Une carte vous a été partagée sur FlySpot.</p><p><a href="${link}">Ouvrir la carte</a></p>`,
        text: `Une carte vous a été partagée sur FlySpot. Ouvrir: ${link}`,
      });
    } catch {}
    redirect("/maps?updated=1");
  }

  return (
    <div className="max-w-2xl mx-auto p-3 pb-24 md:p-6 md:pb-6 space-y-6">
      <ClientUpdatedPing />
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Mes cartes</h1>
        <p className="text-sm text-muted-foreground">Créez des cartes privées et ajoutez-y vos spots.</p>
      </div>

      <form action={createMap} className="rounded-xl border p-4 md:p-5 bg-card text-card-foreground space-y-3">
        <div>
          <label className="block text-sm font-medium">Nom de la carte</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Ex. Vols longue distance"
            className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Icône / Emoji (optionnel)</label>
          <EmojiPicker name="icon" />
        </div>
        <div>
          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">
            Créer la carte
          </button>
        </div>
      </form>

      <div className="rounded-xl border divide-y">
        {maps.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Vous n'avez pas encore de carte.</div>
        ) : (
          maps.map((m) => (
            <div key={m.id} className="p-4 gap-3 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent/40 transition-colors">
              <a href={`/maps/${m.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="font-medium truncate">{m.name}</div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${m.linkPublic ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                    {m.linkPublic ? "Publique" : "Privée"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Créée le {new Date(m.createdAt).toLocaleDateString()}</div>
              </a>
              <div className="flex items-center gap-2">
                <a href={`/maps/${m.id}/share`} className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">Partager</a>
                <a href={`/maps/${m.id}/edit`} className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">Modifier</a>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-1 mt-6">
        <h2 className="text-lg font-semibold">Cartes partagées avec moi</h2>
        <p className="text-sm text-muted-foreground">Les cartes auxquelles vous avez accès.</p>
      </div>
      <div className="rounded-xl border divide-y">
        {sharedMaps.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Aucune carte partagée.</div>
        ) : (
          sharedMaps.map((s) => (
            <div key={s.map.id} className="p-4 gap-3 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-accent/40 transition-colors">
              <a href={`/maps/${s.map.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="font-medium truncate">{s.map.name}</div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.map.linkPublic ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                    {s.map.linkPublic ? "Publique" : "Privée"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Créée le {new Date(s.map.createdAt).toLocaleDateString()}</div>
              </a>
              <form action={leaveSharedMap}>
                <input type="hidden" name="mapId" value={s.map.id} />
                <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                  Quitter
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


