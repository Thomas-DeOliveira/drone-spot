import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
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
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json({ 
        message: "Si un compte avec cette adresse email existe, vous recevrez un email de réinitialisation." 
      }, { status: 200 });
    }

    // Vérifier que l'email est vérifié
    if (!user.emailVerified) {
      return NextResponse.json({ 
        error: "Veuillez d'abord vérifier votre adresse email avant de demander une réinitialisation de mot de passe." 
      }, { status: 400 });
    }

    // Générer un token de réinitialisation
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Supprimer les anciens tokens de réinitialisation pour cet email
    await prisma.verificationToken.deleteMany({
      where: { 
        identifier: email,
        // On peut ajouter un type de token si nécessaire
      },
    });

    // Créer un nouveau token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Envoyer l'email de réinitialisation
    try {
      await sendPasswordResetEmail(email, token);
      return NextResponse.json({ 
        message: "Si un compte avec cette adresse email existe, vous recevrez un email de réinitialisation." 
      }, { status: 200 });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
      return NextResponse.json({ 
        error: "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json({ 
      error: "Erreur interne du serveur" 
    }, { status: 500 });
  }
}
