import * as React from "react";
import EmailLayout from "./components/EmailLayout";

type Props = {
  verificationUrl: string;
};

export default function VerificationEmail({ verificationUrl }: Props) {
  return (
    <EmailLayout title="Vérifiez votre email" previewText="Activez votre compte FlySpot">
      <h1 style={{ margin: 0, marginBottom: 8, fontSize: 20, lineHeight: "28px", color: "#111827" }}>Bienvenue sur FlySpot !</h1>
      <p style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>
        Merci de vous être inscrit. Pour activer votre compte, cliquez sur le bouton ci-dessous.
      </p>
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={verificationUrl}
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
          Vérifier mon email
        </a>
      </div>
      <p style={{ marginTop: 0, marginBottom: 12, color: "#6B7280", fontSize: 14 }}>
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
      </p>
      <a href={verificationUrl} style={{ color: "#2563EB", wordBreak: "break-all", fontSize: 14 }}>{verificationUrl}</a>
      <p style={{ marginTop: 24, color: "#6B7280", fontSize: 12 }}>
        Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
      </p>
    </EmailLayout>
  );
}


