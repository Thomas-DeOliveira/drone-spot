"use client";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, LocateFixed, Filter, ChevronDown, Check, X, MapPin, Layers, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthErrorHandler } from "./hooks/useAuthError";


type Spot = {
  id: string;
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  user?: { id: string; name: string | null };
  images?: { url: string }[];
  tags?: { id: string; name: string }[];
};

type Tag = {
  id: string;
  name: string;
};

// Themed map marker using DivIcon and design tokens from the app theme
function createThemedMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <span class="map-marker">
        <span class="map-marker-dot"></span>
      </span>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Small user position icon (keeps constant size during zoom animations)
function createUserPositionIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <span class="user-marker">
        <span class="user-marker-dot"></span>
      </span>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
}

// Cluster icon with dynamic size and a brand-consistent pill style
function createClusterIcon(count: number, isDark: boolean): L.DivIcon {
  // Sizing tiers
  let size = 36;
  if (count >= 100) size = 54;
  else if (count >= 10) size = 44;

  const bg = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
  const border = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)';
  const text = isDark ? '#0B1220' : '#ffffff';

  const style = [
    `width:${size}px`,
    `height:${size}px`,
    `border-radius:9999px`,
    `background: ${bg}`,
    `border:2px solid ${border}`,
    `box-shadow: 0 6px 18px rgba(0,0,0,0.35)`,
    `backdrop-filter: blur(2px)`,
    `display:flex`,
    `align-items:center`,
    `justify-content:center`,
    `font-weight:700`,
    `font-size:${size <= 36 ? 12 : size <= 44 ? 13 : 14}px`,
    `color:${text}`,
    `cursor:pointer`,
  ].join(";");

  return L.divIcon({
    html: `<div style="${style}">${count}</div>`,
    className: "", // all styling inline
    iconSize: [size, size],
  });
}

// Composant pour gérer les événements de clic sur la carte
function MapClickHandler({ onMapClick, isPlacementMode, canCreate }: { onMapClick: (lat: number, lng: number) => void; isPlacementMode: boolean; canCreate: boolean }) {
  useMapEvents({
    click: (e) => {
      if (!canCreate) return;
      // Ne déclenche le clic que si on est en mode placement explicite
      if (!isPlacementMode) return;
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

export function MapView({ spots, tags, currentMapId, canCreate = true }: { spots: Spot[]; tags: Tag[]; currentMapId?: string; canCreate?: boolean }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite">("standard");
  const [showDroneZones, setShowDroneZones] = useState(false);
  const [isUiSuppressed, setIsUiSuppressed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { showAuthDialog } = useAuthErrorHandler();
  const [manualOpen, setManualOpen] = useState(false);
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");
  const [manualError, setManualError] = useState<string>("");

  useEffect(() => {
    // Set a cohesive default themed icon for all markers
    (L.Marker.prototype.options.icon as any) = createThemedMarkerIcon();
  }, []);

  // Suivre le thème (next-themes ajoute la classe 'dark' sur html)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const center = useMemo(() => {
    // Position de base: France (Paris). On ne dépend plus du premier spot.
    return [48.8566, 2.3522] as [number, number];
  }, []);

  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterIndex, setClusterIndex] = useState<Supercluster<any, any> | null>(null);

  // Charger la préférence de style de carte
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("mapStyle");
    if (saved === "standard" || saved === "satellite") {
      setMapStyle(saved);
    }
    const savedZones = localStorage.getItem("showDroneZones");
    if (savedZones === "true") setShowDroneZones(true);
  }, []);

  // Persister la préférence
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("mapStyle", mapStyle);
  }, [mapStyle]);

  // Persister la préférence des zones drone
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("showDroneZones", String(showDroneZones));
  }, [showDroneZones]);

  // Réagir à l'ouverture du menu mobile: masquer les contrôles carte
  useEffect(() => {
    function onMobileMenuToggle(e: any) {
      if (e?.detail && typeof e.detail.open === "boolean") {
        setIsUiSuppressed(e.detail.open);
        if (e.detail.open) {
          setIsFilterOpen(false);
        }
      }
    }
    window.addEventListener("mobile-menu-toggle", onMobileMenuToggle as any);
    return () => window.removeEventListener("mobile-menu-toggle", onMobileMenuToggle as any);
  }, []);

  // Filtrer les spots selon les tags sélectionnés
  const filteredSpots = useMemo(() => {
    if (selectedTags.length === 0) {
      return spots;
    }
    
    return spots.filter(spot => 
      spot.tags?.some(tag => selectedTags.includes(tag.id))
    );
  }, [spots, selectedTags]);

  // Construire l'index de clustering à partir des spots filtrés
  const clusterPoints = useMemo(() => {
    return filteredSpots.map((s) => ({
      type: "Feature",
      properties: { spotId: s.id },
      geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
    }));
  }, [filteredSpots]);

  useEffect(() => {
    const idx = new Supercluster({ radius: 60, maxZoom: 18 });
    idx.load(clusterPoints as any);
    setClusterIndex(idx);
  }, [clusterPoints]);

  const updateClusters = () => {
    if (!clusterIndex || !mapRef.current) return;
    const b = mapRef.current.getBounds();
    const zoom = Math.round(mapRef.current.getZoom());
    const bbox: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const cs = clusterIndex.getClusters(bbox, zoom);
    setClusters(cs);
  };

  useEffect(() => {
    if (!clusterIndex || !mapRef.current) return;
    updateClusters();
    const map = mapRef.current;
    const handler = () => updateClusters();
    map.on("moveend", handler);
    map.on("zoomend", handler);
    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [clusterIndex, mapReady]);

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

  const handleMapClick = (lat: number, lng: number) => {
    // En mode placement: rediriger directement vers le formulaire
    if (!session?.user || !canCreate) {
      if (!session?.user) showAuthDialog();
      setIsPlacementMode(false);
      return;
    }
    const mapParam = currentMapId ? `&mapId=${currentMapId}` : "";
    router.push(`/spots/new?lat=${lat}&lng=${lng}${mapParam}`);
    setIsPlacementMode(false);
  };

  // Écoute l’événement global pour démarrer le mode placement
  useEffect(() => {
    function onStartPlacement(e: any) {
      if (!canCreate) return;
      if (!session?.user) {
        showAuthDialog();
        return;
      }
      setIsPlacementMode(true);
    }
    window.addEventListener("start-spot-placement", onStartPlacement as any);
    return () => window.removeEventListener("start-spot-placement", onStartPlacement as any);
  }, [canCreate, session?.user, showAuthDialog]);

  // Échapper pour annuler
  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") setIsPlacementMode(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);


  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedTagsData = selectedTags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean);
  // Fly when userPos becomes available and map is ready
  useEffect(() => {
    if (!userPos || !mapRef.current) return;
    // ensure smooth animation on all devices
    mapRef.current.setView(userPos, 14, { animate: true });
  }, [userPos]);

  // Géolocalisation automatique au chargement
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    const success = (pos: GeolocationPosition) => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(coords);
      const map = mapRef.current;
      if (map) {
        map.flyTo(coords, 14);
      }
    };
    const error = () => {
      // pas de permission ou indisponible: on ignore
    };
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 10_000,
    });
  }, []);

  // Plus besoin de surveiller les popups pour la création de spot

  return (
    <div className="relative h-full w-full">
      {!canCreate && !isUiSuppressed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40">
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
            Lecture seule
          </span>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        className={`h-full w-full [&>.leaflet-pane]:!z-0 ${isPlacementMode ? 'cursor-crosshair' : ''}`}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            setMapReady(true);
          }
        }}
      >
        {mapStyle === "satellite" ? (
          <TileLayer
            attribution='Tiles © Esri — Source: Esri, i‑cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR‑EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        <MapClickHandler onMapClick={handleMapClick} isPlacementMode={isPlacementMode} canCreate={canCreate} />
        {userPos ? (
          <Marker position={userPos} icon={createUserPositionIcon()} />
        ) : null}

        {clusters.map((f: any) => {
          const [lng, lat] = f.geometry.coordinates;
          const isCluster = f.properties && f.properties.cluster;
          if (isCluster) {
            const count: number = f.properties.point_count;
            const icon = createClusterIcon(count, isDarkMode);
            return (
              <Marker
                key={`cluster-${f.id}`}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (!clusterIndex || !mapRef.current) return;
                    const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(f.id), 18);
                    mapRef.current.setView([lat, lng], expansionZoom, { animate: true });
                  },
                }}
              />
            );
          }
          // Point unique
          const spotId: string = f.properties?.spotId;
          const s = filteredSpots.find((sp) => sp.id === spotId);
          if (!s) return null;
          return (
            <Marker key={s.id} position={[s.latitude, s.longitude]} icon={createThemedMarkerIcon()}>
              <Popup 
                className="custom-popup" 
                maxWidth={280} 
                minWidth={280}
              >
                <div className="w-full">
                  {s.images?.[0]?.url ? (
                    <div className="relative w-full h-32 rounded-t-lg overflow-hidden mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={s.images[0].url} 
                        alt={s.title} 
                        className="h-full w-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg mb-3 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-primary/60" />
                    </div>
                  )}
                  <div className="px-1 pb-2">
                    <h3 className="font-semibold text-base text-foreground mb-2 line-clamp-2">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}
                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {s.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {s.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            +{s.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/spots/${s.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md py-2.5 px-4"
                    >
                      <span>Voir le spot</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Calque WMS des zones de restriction drones (IGN Géoportail) */}
        {showDroneZones && (
          <TileLayer
            url={`https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${encodeURIComponent(process.env.NEXT_PUBLIC_IGN_DRONES_LAYER || "TRANSPORTS.DRONES.RESTRICTIONS")}&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`}
            opacity={0.7}
          />
        )}
      </MapContainer>

      {/* Filtre par tag - top-left */}
      <div className={`absolute left-2 top-2 lg:left-3 lg:top-3 z-[3000] ${isUiSuppressed ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="relative inline-block" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1 lg:gap-2 px-2 py-1.5 lg:px-3 lg:py-2 bg-background border border-border rounded-lg shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors text-xs lg:text-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">
              {selectedTags.length === 0 
                ? "Filtrer par tag" 
                : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`
              }
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px] w-max">
              {tags.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  Aucun tag disponible
                </div>
              ) : (
                <div className="py-1">
                  {selectedTags.length > 0 && (
                    <div className="px-3 py-2 border-b border-border">
                      <button
                        onClick={handleClearAll}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Effacer tout
                      </button>
                    </div>
                  )}
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center justify-center w-4 h-4">
                        {selectedTags.includes(tag.id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="flex-1 text-left">{tag.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls top-right */}
      {!isUiSuppressed && (
      <div className="absolute right-2 top-2 lg:right-3 lg:top-3 z-[3000] flex flex-col gap-1 lg:gap-2">
        <button
          type="button"
          onClick={() => setShowDroneZones(v => !v)}
          className={`h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-md border bg-background text-foreground shadow-sm transition ${showDroneZones ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground"}`}
          aria-label="Afficher les zones de restriction drones"
          title={showDroneZones ? "Masquer les zones drones" : "Afficher les zones drones"}
        >
          <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
        </button>
        <button
          type="button"
          onClick={() => setMapStyle(prev => (prev === "standard" ? "satellite" : "standard"))}
          className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition"
          aria-label="Basculer carte/satellite"
          title={mapStyle === "satellite" ? "Vue satellite" : "Vue carte"}
        >
          <Layers className="h-3 w-3 lg:h-4 lg:w-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current && mapRef.current.zoomIn()}
          className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition"
          aria-label="Zoom in"
        >
          <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current && mapRef.current.zoomOut()}
          className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition"
          aria-label="Zoom out"
        >
          <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            if (userPos) {
              map.setView(userPos, 14, { animate: true });
            } else {
              map.flyTo(center, map.getZoom());
            }
          }}
          className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition"
          aria-label="Recenter"
        >
          <LocateFixed className="h-3 w-3 lg:h-4 lg:w-4" />
        </button>
      </div>
      )}

      {/* Bandeau d'aide en mode placement */}
      {isPlacementMode && !isUiSuppressed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[4000]">
          <div className="inline-flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-amber-500/95 text-black shadow-lg ring-1 ring-black/10">
            <MapPin className="w-4 h-4" />
            <span className="text-sm md:text-base font-semibold">Cliquez sur la carte pour choisir l’emplacement du spot</span>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="ml-2 inline-flex items-center rounded-md bg-black/80 text-white text-xs md:text-sm px-2.5 py-1 hover:bg-black"
            >
              Entrer des coordonnées
            </button>
            <span className="hidden md:inline text-xs font-medium text-black/80">(Échap pour annuler)</span>
          </div>
        </div>
      )}

      {/* Modale saisie manuelle lat/lng */}
      {isPlacementMode && manualOpen && (
        <div className="absolute inset-0 z-[4500] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm mx-4 p-4">
            <h3 className="font-semibold text-lg mb-2">Entrer des coordonnées</h3>
            <p className="text-sm text-muted-foreground mb-4">Saisissez une latitude et une longitude (WGS84).</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Latitude</label>
                <input
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="48.8566"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Longitude</label>
                <input
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="2.3522"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  inputMode="decimal"
                />
              </div>
              {manualError && <div className="text-xs text-red-600">{manualError}</div>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualOpen(false);
                    setManualError("");
                  }}
                  className="flex-1 h-9 rounded-md border bg-muted text-muted-foreground hover:bg-muted/80 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Validation
                    const lat = Number(manualLat);
                    const lng = Number(manualLng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                      setManualError("Coordonnées invalides");
                      return;
                    }
                    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                      setManualError("Latitude/Longitude hors bornes");
                      return;
                    }
                    setManualError("");
                    setManualOpen(false);
                    handleMapClick(lat, lng);
                  }}
                  className="flex-1 h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB supprimé; bouton déplacé dans la sidebar */}
    </div>
  );
}


