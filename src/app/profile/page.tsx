import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { User, Mail, Calendar, MapPin, Star } from "lucide-react";
import Link from "next/link";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/");
  }

  // Récupérer les informations de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      spots: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          ratings: {
            select: { value: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      },
      _count: {
        select: {
          spots: true,
          ratings: true
        }
      }
    }
  });

  if (!user) {
    redirect("/");
  }

  // Calculer la note moyenne des spots de l'utilisateur
  const averageRating = user.spots.length > 0 
    ? user.spots.reduce((acc, spot) => {
        const spotAverage = spot.ratings.length > 0 
          ? spot.ratings.reduce((sum, rating) => sum + rating.value, 0) / spot.ratings.length
          : 0;
        return acc + spotAverage;
      }, 0) / user.spots.length
    : 0;

  return (
    <ProfileClient 
      user={user}
      averageRating={averageRating}
    />
  );
}
