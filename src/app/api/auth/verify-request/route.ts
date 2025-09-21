import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL(`/verify-email?error=true&message=Token ou email manquant`, request.url));
  }

  try {
    // Vérifier d'abord si l'email est déjà vérifié
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true }
    });

    if (!user) {
      return NextResponse.redirect(new URL(`/verify-email?error=true&message=Utilisateur non trouvé`, request.url));
    }

    if (user.emailVerified) {
      // L'email est déjà vérifié, rediriger vers une page d'information
      return NextResponse.redirect(new URL(`/verify-email?already_verified=true&email=${email}`, request.url));
    }

    // Vérifier le token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.identifier !== email) {
      return NextResponse.redirect(new URL(`/verify-email?error=true&message=Token invalide`, request.url));
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.redirect(new URL(`/verify-email?error=true&message=Token expiré`, request.url));
    }

    // Marquer l'email comme vérifié
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Supprimer le token utilisé
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Rediriger vers la page de succès
    return NextResponse.redirect(new URL(`/verify-email?success=true&email=${email}`, request.url));
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return NextResponse.redirect(new URL(`/verify-email?error=true&message=Erreur interne du serveur`, request.url));
  }
}
