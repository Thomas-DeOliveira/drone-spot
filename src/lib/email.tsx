import { sendEmail } from "./mailer";
import { render } from "@react-email/render";
import VerificationEmail from "@/emails/VerificationEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import MapShareInviteEmail from "@/emails/MapShareInviteEmail";

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/api/auth/verify-request?token=${token}&email=${encodeURIComponent(email)}`;
  const html = await render(<VerificationEmail verificationUrl={verificationUrl} />);
  await sendEmail({
    to: email,
    subject: "Vérifiez votre adresse email - FlySpot",
    html,
    text: `Vérifiez votre adresse email: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/api/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const html = await render(<ResetPasswordEmail resetUrl={resetUrl} />);
  await sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe - FlySpot",
    html,
    text: `Réinitialisez votre mot de passe: ${resetUrl}`,
  });
}

export async function sendMapShareInviteEmail(toEmail: string, mapName: string, role: "READ" | "WRITE", mapId: string, ownerName: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/maps/${mapId}`;
  const roleLabel = role === "WRITE" ? "Modification" : "Lecture";
  const html = await render(<MapShareInviteEmail mapName={mapName} roleLabel={roleLabel} link={link} ownerName={ownerName} />);
  await sendEmail({
    to: toEmail,
    subject: `Partage de la carte "${mapName}" sur FlySpot`,
    html,
    text: `La carte ${mapName} vous a été partagée. Accès: ${roleLabel}. Ouvrir: ${link}`,
  });
}


