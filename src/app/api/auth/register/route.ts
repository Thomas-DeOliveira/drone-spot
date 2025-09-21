import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();
  const password = String(body?.password || "").trim();
  const name = String(body?.name || "").trim() || null;
  
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }
  
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Utilisateur déjà existant" }, { status: 409 });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ 
    data: { 
      email, 
      name, 
      passwordHash,
      emailVerified: null // L'email n'est pas encore vérifié
    } 
  });

  // Générer un token de vérification
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

  // Créer le token de vérification
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  // Envoyer l'email de vérification
  try {
    await sendVerificationEmail(email, token);
    return NextResponse.json({ 
      message: "Compte créé avec succès. Vérifiez votre email pour activer votre compte.",
      emailSent: true 
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de vérification:", error);
    // Le compte est créé mais l'email n'a pas pu être envoyé
    return NextResponse.json({ 
      message: "Compte créé mais impossible d'envoyer l'email de vérification. Vous pouvez demander un nouveau lien.",
      emailSent: false,
      userId: user.id 
    }, { status: 201 });
  }
}


