import * as React from "react";
import EmailLayout from "./components/EmailLayout";

type Props = {
  resetUrl: string;
};

export default function ResetPasswordEmail({ resetUrl }: Props) {
  return (
    <EmailLayout title="Réinitialisez votre mot de passe" previewText="Lien de réinitialisation FlySpot">
      <h1 style={{ margin: 0, marginBottom: 8, fontSize: 20, lineHeight: "28px", color: "#111827" }}>Réinitialisation de mot de passe</h1>
      <p style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>
        Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.
      </p>
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={resetUrl}
          style={{
            backgroundColor: "#111827",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: 8,
            textDecoration: "none",
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style={{ marginTop: 0, marginBottom: 12, color: "#6B7280", fontSize: 14 }}>
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
      </p>
      <a href={resetUrl} style={{ color: "#2563EB", wordBreak: "break-all", fontSize: 14 }}>{resetUrl}</a>
      <p style={{ marginTop: 24, color: "#6B7280", fontSize: 12 }}>
        Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      </p>
    </EmailLayout>
  );
}


