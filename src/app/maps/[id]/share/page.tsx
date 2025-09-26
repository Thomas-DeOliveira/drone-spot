import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export default async function ShareMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  const map = await prisma.map.findUnique({ where: { id }, select: { id: true, name: true, userId: true } });
  if (!map) return notFound();
  if (map.userId !== (session.user.id as string)) redirect("/maps");

  async function addShare(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const mapId = String(formData.get("mapId") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const role = String(formData.get("role") || "READ").toUpperCase() as any;
    if (!mapId || !email) return;
    const m = await prisma.map.findUnique({ where: { id: mapId }, select: { userId: true, name: true } });
    if (!m || m.userId !== (s.user.id as string)) return;
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.mapShare.upsert({
      where: { mapId_invitedEmail: { mapId, invitedEmail: email } },
      create: { mapId, invitedEmail: email, invitedUserId: user?.id || null, role },
      update: { invitedUserId: user?.id || null, role },
    });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
      const link = `${baseUrl}/maps/${mapId}`;
      await sendEmail({
        to: email,
        subject: `Partage de la carte "${m.name}" sur FlySpot`,
        html: `<p>Bonjour,</p><p>La carte <strong>${m.name}</strong> vous a été partagée sur FlySpot.</p><p>Accès: ${role === "WRITE" ? "Modification" : "Lecture"}</p><p><a href="${link}">Ouvrir la carte</a></p>`,
        text: `La carte ${m.name} vous a été partagée. Accès: ${role}. Ouvrir: ${link}`,
      });
    } catch {}
    redirect(`/maps/${mapId}/share?updated=1`);
  }

  async function removeShare(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const mapId = String(formData.get("mapId") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!mapId || !email) return;
    const m = await prisma.map.findUnique({ where: { id: mapId }, select: { userId: true } });
    if (!m || m.userId !== (s.user.id as string)) return;
    await prisma.mapShare.delete({ where: { mapId_invitedEmail: { mapId, invitedEmail: email } } });
    redirect(`/maps/${mapId}/share?updated=1`);
  }

  async function updateRole(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const mapId = String(formData.get("mapId") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const role = String(formData.get("role") || "READ").toUpperCase() as any;
    if (!mapId || !email) return;
    const m = await prisma.map.findUnique({ where: { id: mapId }, select: { userId: true } });
    if (!m || m.userId !== (s.user.id as string)) return;
    await prisma.mapShare.update({ where: { mapId_invitedEmail: { mapId, invitedEmail: email } }, data: { role } });
    redirect(`/maps/${mapId}/share?updated=1`);
  }

  const shares = await prisma.mapShare.findMany({ where: { mapId: map.id }, select: { invitedEmail: true, role: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold">Partager la carte</h1>
        <p className="text-sm text-muted-foreground">Ajouter des personnes et définir leurs droits.</p>
      </div>

      <form action={addShare} className="rounded-xl border p-4 md:p-5 bg-card text-card-foreground space-y-3">
        <input type="hidden" name="mapId" value={map.id} />
        <div>
          <label className="block text-sm font-medium">Adresse e-mail</label>
          <input type="email" name="email" required placeholder="exemple@domaine.com"
                 className="w-full h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium">Droits</label>
          <select name="role" defaultValue="READ" className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            <option value="READ">Lecture</option>
            <option value="WRITE">Modification</option>
          </select>
        </div>
        <div>
          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">Partager</button>
        </div>
      </form>

      <div className="rounded-xl border">
        {shares.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Aucun partage pour l’instant.</div>
        ) : (
          <div className="divide-y">
            {shares.map((s) => (
              <div key={s.invitedEmail} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.invitedEmail}</div>
                </div>
                <form action={updateRole} className="flex items-center gap-2">
                  <input type="hidden" name="mapId" value={map.id} />
                  <input type="hidden" name="email" value={s.invitedEmail} />
                  <select name="role" defaultValue={s.role} className="h-8 rounded-md border bg-background px-2 text-sm">
                    <option value="READ">Lecture</option>
                    <option value="WRITE">Modification</option>
                  </select>
                  <button type="submit" className="inline-flex items-center justify-center rounded-md text-xs font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2">Mettre à jour</button>
                </form>
                <form action={removeShare}>
                  <input type="hidden" name="mapId" value={map.id} />
                  <input type="hidden" name="email" value={s.invitedEmail} />
                  <button type="submit" className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 h-8 px-2">Retirer</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


