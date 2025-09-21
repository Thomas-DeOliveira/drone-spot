import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const reqHeaders = await headers();
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
  const baseOrigin = envOrigin || new URL(reqHeaders.get("x-url") || request.url).origin;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL(`/reset-password?error=Token manquant`, baseOrigin));
  }

  try {
    // Vérifier que le token existe et n'est pas expiré
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL(`/reset-password?error=Token invalide`, baseOrigin));
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.redirect(new URL(`/reset-password?error=Token expiré`, baseOrigin));
    }

    // Rediriger vers la page de réinitialisation avec le token
    return NextResponse.redirect(new URL(`/reset-password?token=${token}`, baseOrigin));
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return NextResponse.redirect(new URL(`/reset-password?error=Erreur interne`, baseOrigin));
  }
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token et nouveau mot de passe requis" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    // Vérifier le token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ error: "Token expiré" }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { passwordHash },
    });

    // Supprimer le token utilisé
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ 
      message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter." 
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error);
    return NextResponse.json({ 
      error: "Erreur interne du serveur" 
    }, { status: 500 });
  }
}
