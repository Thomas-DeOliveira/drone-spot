"use client";
import { useState, useMemo, useEffect } from "react";
import ProgressiveImage from "../(components)/ProgressiveImage";
import Image from "next/image";
import Link from "next/link";
import TagFilter from "../(components)/TagFilter";
import SortButtons, { SortOption } from "../(components)/SortButtons";
import { calculateDistance, formatDistance, getUserLocation } from "@/lib/geolocation";
import { MapPin } from "lucide-react";

interface Spot {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  images: Array<{ url: string }>;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  tags: Array<{
    id: string;
    name: string;
  }>;
  distance?: number;
}

interface Tag {
  id: string;
  name: string;
}

interface SpotsListClientProps {
  spots: Spot[];
  tags: Tag[];
  showMapBadges?: boolean;
  showTitle?: boolean;
}

export default function SpotsListClient({ spots, tags, showMapBadges = false, showTitle = true }: SpotsListClientProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("distance");

  // Obtenir la position de l'utilisateur au chargement
  useEffect(() => {
    getUserLocation().then((location) => {
      setUserLocation(location);
      setIsLoadingLocation(false);
      
      // Si pas de géolocalisation et qu'on était sur "distance", basculer sur "date"
      if (!location && sortBy === "distance") {
        setSortBy("date");
      }
    });
  }, [sortBy]);

  const filteredSpots = useMemo(() => {
    let filtered = selectedTags.length === 0 
      ? spots 
      : spots.filter(spot => spot.tags.some(tag => selectedTags.includes(tag.id)));

    // Ajouter la distance si la position de l'utilisateur est disponible
    if (userLocation) {
      filtered = filtered.map(spot => ({
        ...spot,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          spot.latitude,
          spot.longitude
        )
      }));
    }

    // Trier selon l'option sélectionnée
    if (sortBy === "distance" && userLocation) {
      filtered = filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    } else {
      // Tri par date (plus récent en premier)
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [spots, selectedTags, userLocation, sortBy]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearAll = () => {
    setSelectedTags([]);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  return (
    <div className="p-3 pb-24 md:p-6 md:pb-6">
      {showTitle && (
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight mb-4 md:mb-5">Liste des spots</h1>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <TagFilter
            tags={tags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearAll={handleClearAll}
          />
        </div>
        <div className="flex items-center gap-2">
          <SortButtons
            currentSort={sortBy}
            onSortChange={handleSortChange}
            hasLocation={!!userLocation}
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {isLoadingLocation ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Localisation en cours...</span>
          </div>
        ) : (
          <>
            {filteredSpots.length} spot{filteredSpots.length > 1 ? 's' : ''} trouvé{filteredSpots.length > 1 ? 's' : ''}
            {sortBy === "distance" && userLocation && (
              <span> (triés par distance)</span>
            )}
            {sortBy === "date" && (
              <span> (triés par date{!userLocation ? ' - géolocalisation indisponible' : ''})</span>
            )}
            {selectedTags.length > 0 && (
              <span> (filtré{selectedTags.length > 1 ? 's' : ''} par {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''})</span>
            )}
          </>
        )}
      </div>

      {filteredSpots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Aucun spot trouvé</p>
          <p className="text-sm">
            {selectedTags.length > 0 
              ? "Essayez de modifier vos filtres ou effacez-les pour voir tous les spots."
              : "Il n'y a pas encore de spots dans la base de données."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {filteredSpots.map((s) => (
            <Link
              key={s.id}
              href={`/spots/${s.id}`}
              className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:bg-accent transition-colors"
            >
              <div className="relative h-40 w-full bg-muted">
                {s.images?.[0]?.url ? (
                  <ProgressiveImage
                    src={s.images[0].url}
                    alt={s.title}
                    fill
                    className=""
                    imgClassName="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    lowQuality={10}
                    highQuality={60}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Aucune image</div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="font-medium truncate">{s.title}</div>
                {showMapBadges && (
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const rawMap = (s as any).map as (undefined | { id: string; name: string; icon?: string | null; userId?: string | null });
                      const rawMaps = ((s as any).maps as Array<{ map: { id: string; name: string; icon?: string | null; userId?: string | null } }> | undefined) || [];
                      const all: Array<{ id: string; name: string; icon?: string | null; userId?: string | null }> = [];
                      if (rawMap && rawMap.id) all.push(rawMap);
                      for (const link of rawMaps) {
                        if (link?.map?.id) all.push(link.map);
                      }
                      const seen = new Set<string>();
                      const uniq = all.filter((m) => (m?.id && !seen.has(m.id) ? (seen.add(m.id), true) : false));
                      if (uniq.length === 0) {
                        return (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Public</span>
                        );
                      }
                      return uniq.map((m) => (
                        <span key={m.id} className="text-[11px] px-2 py-0.5 rounded-full border bg-muted/60 text-foreground/80">
                          <span className="mr-1">{m.icon ? m.icon : "✈️"}</span>
                          <span className="align-middle">{m.name}</span>
                        </span>
                      ));
                    })()}
                  </div>
                )}
                
                {/* Tags du spot */}
                {s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag.id}
                        className={`text-xs px-2 py-1 rounded-full ${
                          selectedTags.includes(tag.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {s.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        +{s.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  {/* Distance */}
                  {userLocation && typeof (s as any).distance === 'number' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{formatDistance((s as any).distance as number)}</span>
                    </div>
                  )}
                  
                  {/* Auteur */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s.user?.image ? (
                      <Image
                        src={s.user.image}
                        alt="Photo de profil"
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                        {(s.user?.name || s.user?.email || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="truncate">Ajouté par {s.user?.name || s.user?.email || "Utilisateur"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
