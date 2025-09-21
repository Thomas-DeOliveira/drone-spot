import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: "Aucun compte trouvé avec cette adresse email" }, { status: 404 });
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      return NextResponse.json({ error: "Cette adresse email est déjà vérifiée" }, { status: 400 });
    }

    // Générer un nouveau token de vérification
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Supprimer les anciens tokens de vérification pour cet email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Créer un nouveau token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Envoyer l'email de vérification
    await sendVerificationEmail(email, token);

    return NextResponse.json({ 
      message: "Lien de vérification envoyé avec succès" 
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de l'envoi de la vérification:", error);
    return NextResponse.json({ 
      error: "Erreur interne du serveur" 
    }, { status: 500 });
  }
}
