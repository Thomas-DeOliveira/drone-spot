import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");
  const me = await prisma.user.findUnique({ where: { id: session.user.id as string }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const [users, tags, spots] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.spot.findMany({ select: { id: true, title: true, createdAt: true, user: { select: { email: true, name: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  async function addTag(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const me = await prisma.user.findUnique({ where: { id: s.user.id as string }, select: { role: true } });
    if (me?.role !== "ADMIN") redirect("/");
    const name = String(formData.get("name") || "").trim();
    if (!name) return;
    await prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
    redirect("/admin");
  }

  async function deleteTag(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const me = await prisma.user.findUnique({ where: { id: s.user.id as string }, select: { role: true } });
    if (me?.role !== "ADMIN") redirect("/");
    const id = String(formData.get("id"));
    if (!id) return;
    await prisma.tag.delete({ where: { id } });
    redirect("/admin");
  }

  async function deleteSpot(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const me = await prisma.user.findUnique({ where: { id: s.user.id as string }, select: { role: true } });
    if (me?.role !== "ADMIN") redirect("/");
    const id = String(formData.get("id"));
    if (!id) return;
    await prisma.spot.delete({ where: { id } });
    redirect("/admin");
  }

  async function toggleRole(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const me = await prisma.user.findUnique({ where: { id: s.user.id as string }, select: { role: true } });
    if (me?.role !== "ADMIN") redirect("/");
    const id = String(formData.get("id"));
    if (!id) return;
    // éviter de changer son propre rôle
    if (id === s.user.id) return redirect("/admin");
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user) return redirect("/admin");
    const next = user.role === "ADMIN" ? "USER" : "ADMIN";
    await prisma.user.update({ where: { id }, data: { role: next as any } });
    redirect("/admin");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/");
    const me = await prisma.user.findUnique({ where: { id: s.user.id as string }, select: { role: true } });
    if (me?.role !== "ADMIN") redirect("/");
    const id = String(formData.get("id"));
    if (!id) return;
    // Interdire de se supprimer soi-même
    if (id === s.user.id) return redirect("/admin");
    await prisma.user.delete({ where: { id } });
    redirect("/admin");
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">Gestion des utilisateurs, tags et spots.</p>
      </div>

      {/* Users */}
      <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-base font-medium">Utilisateurs</h2>
          <div className="text-xs text-muted-foreground">{users.length} comptes</div>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Nom</th>
                <th className="py-2 pr-3">Rôle</th>
                <th className="py-2 pr-3">Créé le</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2 pr-3">{u.email || ""}</td>
                  <td className="py-2 pr-3">{u.name || ""}</td>
                  <td className="py-2 pr-3">{u.role}</td>
                  <td className="py-2 pr-3">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(u.createdAt)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <form action={toggleRole}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-7 px-2">
                          {u.role === "ADMIN" ? "Rendre USER" : "Rendre ADMIN"}
                        </button>
                      </form>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:opacity-90 h-7 px-2">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tags */}
      <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-base font-medium">Tags</h2>
          <div className="text-xs text-muted-foreground">{tags.length} tags</div>
        </div>
        <div className="p-4 space-y-4">
          <form action={addTag} className="flex items-center gap-2">
            <input name="name" placeholder="Nouveau tag" className="h-9 w-56 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">Ajouter</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <form key={t.id} action={deleteTag}>
                <input type="hidden" name="id" value={t.id} />
                <button className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs hover:bg-accent">
                  <span>{t.name}</span>
                  <span className="text-muted-foreground">×</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </section>

      {/* Spots */}
      <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-base font-medium">Spots</h2>
          <div className="text-xs text-muted-foreground">{spots.length} spots</div>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3">Titre</th>
                <th className="py-2 pr-3">Auteur</th>
                <th className="py-2 pr-3">Créé le</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spots.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2 pr-3">{s.title}</td>
                  <td className="py-2 pr-3">{s.user?.name || s.user?.email || ""}</td>
                  <td className="py-2 pr-3">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(s.createdAt)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/spots/${s.id}/edit`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-7 px-2"
                      >
                        Modifier
                      </Link>
                      <form action={deleteSpot}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:opacity-90 h-7 px-2">Supprimer</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


