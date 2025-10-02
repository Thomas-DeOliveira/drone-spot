import * as React from "react";
import EmailLayout from "./components/EmailLayout";

type Props = {
  mapName: string;
  roleLabel: string;
  link: string;
  ownerName: string;
};

export default function MapShareInviteEmail({ mapName, roleLabel, link, ownerName }: Props) {
  return (
    <EmailLayout title={`Invitation à une carte`} previewText={`Vous avez été invité à la carte "${mapName}"`}>
      <h1 style={{ margin: 0, marginBottom: 8, fontSize: 20, lineHeight: "28px", color: "#111827" }}>
        Invitation à une carte
      </h1>
      <p style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>
        La carte <strong>{mapName}</strong> vous a été partagée par <strong>{ownerName}</strong> sur FlySpot.
      </p>
      <p style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>
        Droits accordés: <strong>{roleLabel}</strong>
      </p>
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <a
          href={link}
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
          Ouvrir la carte
        </a>
      </div>
      <p style={{ marginTop: 0, marginBottom: 12, color: "#6B7280", fontSize: 14 }}>
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
      </p>
      <a href={link} style={{ color: "#2563EB", wordBreak: "break-all", fontSize: 14 }}>{link}</a>
    </EmailLayout>
  );
}


