"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Calendar, MapPin, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AvatarUpload from "../(components)/AvatarUpload";

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    spots: Array<{
      id: string;
      title: string;
      createdAt: Date;
      ratings: Array<{ value: number }>;
    }>;
    _count: {
      spots: number;
      ratings: number;
    };
  };
  averageRating: number;
}

export default function ProfileClient({ user, averageRating }: ProfileClientProps) {
  const { update } = useSession();
  const [currentAvatar, setCurrentAvatar] = useState(user.image);

  const handleAvatarChange = async (avatarUrl: string) => {
    setCurrentAvatar(avatarUrl);
    // Mettre à jour la session pour refléter le changement
    await update();
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-4xl">
      <div className="space-y-4 md:space-y-6">
        {/* En-tête du profil */}
        <div className="bg-card border rounded-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-shrink-0">
              <AvatarUpload
                currentAvatar={currentAvatar}
                userName={user.name || "Utilisateur"}
                onAvatarChange={handleAvatarChange}
                editable={false}
              />
            </div>
            <div className="flex-1 w-full">
              <h1 className="text-xl md:text-2xl font-bold">{user.name || "Utilisateur"}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}</span>
                </div>
              </div>
            </div>
            <Link
              href="/account"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
            >
              Modifier le profil
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-medium">Spots ajoutés</span>
            </div>
            <p className="text-2xl font-bold mt-1">{user._count.spots}</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium">Notes données</span>
            </div>
            <p className="text-2xl font-bold mt-1">{user._count.ratings}</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium">Note moyenne</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
            </p>
          </div>
        </div>

        {/* Derniers spots ajoutés */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Mes derniers spots</h2>
          {user.spots.length > 0 ? (
            <div className="space-y-3">
              {user.spots.map((spot) => {
                const spotAverage = spot.ratings.length > 0 
                  ? spot.ratings.reduce((sum, rating) => sum + rating.value, 0) / spot.ratings.length
                  : 0;
                
                return (
                  <div key={spot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Link 
                        href={`/spots/${spot.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {spot.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Ajouté le {new Date(spot.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {spotAverage > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{spotAverage.toFixed(1)}</span>
                        </div>
                      )}
                      <Link
                        href={`/spots/${spot.id}/edit`}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Modifier
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun spot ajouté pour le moment</p>
              <Link
                href="/spots/new"
                className="inline-block mt-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Ajouter votre premier spot
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
