import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BackLink from "@/app/(components)/BackLink";
import SpotGallery from "@/app/(components)/SpotGallery";
import SmallMapClient from "@/app/(components)/SmallMapClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RateStarsForm from "@/app/(components)/RateStarsForm";
import { revalidatePath } from "next/cache";
import TagsBadges from "@/app/(components)/TagsBadges";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function SpotDetailPage({ params }: Props) {
  const { id } = await params;
  const spot = await prisma.spot.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      userId: true,
      mapId: true,
      maps: { select: { mapId: true, map: { select: { userId: true } } } },
      user: { select: { name: true, email: true, image: true } },
      images: { select: { url: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!spot) return <div className="p-6">Spot introuvable.</div>;
  const spotId = spot.id;

  const author = spot.user?.name || spot.user?.email || "Utilisateur";
  const authorInitial = (author.trim().split(/\s+/)[0] || "U").charAt(0).toUpperCase();
  const createdFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(spot.createdAt);
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === spot.userId;

  // Protéger l'accès si le spot appartient à une carte privée (mapId défini)
  const mapIds = [spot.mapId, ...(spot.maps?.map((sm) => sm.mapId) || [])].filter(Boolean) as string[];
  if (mapIds.length > 0) {
    // Si pas connecté, refuser l'accès
    if (!session?.user?.id) {
      redirect("/");
    }
    // Autoriser si propriétaire de l'une des cartes ou partagé (READ/WRITE) sur l'une d'elles
    let canRead = false;
    // Vérifier propriété
    const anyOwned = await prisma.map.count({ where: { id: { in: mapIds }, userId: session.user.id as string } });
    if (anyOwned > 0) canRead = true;
    // Vérifier partage
    if (!canRead) {
      const shared = await prisma.mapShare.count({
        where: {
          mapId: { in: mapIds },
          OR: [
            { invitedUserId: session.user.id as string },
            { invitedEmail: (session.user.email as string) || "" },
          ],
        },
      });
      canRead = shared > 0;
    }
    if (!canRead) {
      redirect("/");
    }
  }

  const ratingAgg = await prisma.spotRating.aggregate({
    where: { spotId: spotId },
    _avg: { value: true },
    _count: { _all: true },
  });
  const avgRating = ratingAgg._avg.value ? Number(ratingAgg._avg.value).toFixed(1) : null;
  const ratingCount = ratingAgg._count?._all || 0;
  const avgRounded = ratingAgg._avg.value ? Math.round(Number(ratingAgg._avg.value)) : 0;

  let userInitial = 0;
  if (session?.user?.id) {
    const existing = await prisma.spotRating.findUnique({
      where: { spotId_userId: { spotId: spot.id, userId: session.user.id as string } },
      select: { value: true },
    });
    userInitial = existing?.value || 0;
  }

  async function rateAction(formData: FormData) {
    "use server";
    const s = await getServerSession(authOptions);
    if (!s?.user?.id) redirect("/api/auth/signin");
    const v = Number(formData.get("value"));
    if (!v || v < 1 || v > 5) return;
    await prisma.spotRating.upsert({
      where: { spotId_userId: { spotId: spotId, userId: s.user.id as string } },
      create: { spotId: spotId, userId: s.user.id as string, value: v },
      update: { value: v },
    });
    revalidatePath(`/spots/${spotId}`);
  }

  return (
    <div className="p-3 pb-24 md:p-4 md:pb-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <BackLink className="text-sm underline hover:text-primary" fallbackHref="/spots">← Retour en arrière</BackLink>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight mb-3">{spot.title}</h1>
        <SpotGallery title={spot.title} images={spot.images} />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <TagsBadges spotId={spot.id} />
          <div className="rounded-xl border p-4 bg-card text-card-foreground shadow-sm">
            <h2 className="text-base font-medium mb-2">Description</h2>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {spot.description || "Aucune description fournie."}
            </p>
          </div>

          {spot.images.length > 1 ? (
            <div className="rounded-xl border p-4 bg-card text-card-foreground shadow-sm">
              <h2 className="text-base font-medium mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {spot.images.map((img, idx) => (
                  <div key={idx} className="relative w-full aspect-[4/3] rounded-md overflow-hidden border">
                    <Image src={img.url} alt={`${spot.title} ${idx + 1}`} fill className="object-cover" sizes="25vw" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Localisation moved under photos */}
          <div className="rounded-xl border p-4 bg-card text-card-foreground shadow-sm">
            <h2 className="text-base font-medium mb-2">Localisation</h2>
            <SmallMapClient latitude={spot.latitude} longitude={spot.longitude} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-4 bg-card text-card-foreground shadow-sm space-y-3">
            <h2 className="text-base font-medium">Informations</h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} viewBox="0 0 20 20" className={`h-5 w-5 ${i <= avgRounded ? "fill-yellow-400" : "fill-muted"}`}>
                    <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                  </svg>
                ))}
              </div>
              <span>
                {avgRating ? `${avgRating} / 5` : "Pas encore de note"}
                {ratingCount ? ` (${ratingCount})` : ""}
              </span>
            </div>
            {session?.user ? (
              <div className="flex items-center gap-2">
                <RateStarsForm initial={userInitial} action={rateAction} />
                <span className="text-xs text-muted-foreground">Notez ce spot</span>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              {spot.user?.image ? (
                <Image
                  src={spot.user.image}
                  alt="Photo de profil de l'auteur"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover border"
                />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background text-foreground text-sm">
                  {authorInitial}
                </span>
              )}
              <div className="text-sm">
                <div className="font-medium">{author}</div>
                <div className="text-muted-foreground">Auteur</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted px-2 py-2">
                <div className="text-[11px] text-muted-foreground">Latitude</div>
                <div className="font-mono">{spot.latitude.toFixed(5)}</div>
              </div>
              <div className="rounded-md bg-muted px-2 py-2">
                <div className="text-[11px] text-muted-foreground">Longitude</div>
                <div className="font-mono">{spot.longitude.toFixed(5)}</div>
              </div>
              <div className="rounded-md bg-muted px-2 py-2 col-span-2">
                <div className="text-[11px] text-muted-foreground">Créé le</div>
                <div>{createdFr}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4 bg-card text-card-foreground shadow-sm">
            <h2 className="text-base font-medium mb-2">Actions</h2>
            <a
              href={`https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
            >
              Ouvrir dans Google Maps
            </a>
            {isOwner ? (
              <Link
                href={`/spots/${spot.id}/edit`}
                className="ml-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                Modifier
              </Link>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}


