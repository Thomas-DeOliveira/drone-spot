import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur pour obtenir l'URL actuelle de l'avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Supprimer l'ancien fichier s'il existe
    if (user.image && user.image.startsWith("/uploads/avatars/")) {
      const filePath = join(process.cwd(), "public", user.image);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (error) {
          console.error("Erreur lors de la suppression du fichier:", error);
          // On continue même si la suppression du fichier échoue
        }
      }
    }

    // Mettre à jour la base de données pour supprimer l'URL de l'avatar
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null }
    });

    return NextResponse.json({ 
      message: "Photo de profil supprimée avec succès"
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    return NextResponse.json({ 
      error: "Erreur interne du serveur" 
    }, { status: 500 });
  }
}
