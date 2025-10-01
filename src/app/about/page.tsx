import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import LogoBrand from "../(components)/LogoBrand";
import {
  Map,
  Layers,
  Share2,
  Shield,
  Image as ImageIcon,
  Users,
  Lock,
  Globe,
  Sparkles,
  Plus,
  Star,
  PhoneCall,
  Phone as PhoneIcon,
} from "lucide-react";
import ForceLightTheme from "../(components)/providers/ForceLightTheme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FlySpot – À propos",
  description:
    "Trouvez des spots de drone près de chez vous, créez des cartes et partagez-les en quelques secondes.",
  openGraph: {
    title: "FlySpot – Trouvez et partagez vos spots de drone",
    description:
      "Trouvez des spots de drone près de chez vous, ajoutez des photos, notez et partagez vos cartes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type FeatureProps = {
  icon: IconType;
  title: string;
  desc: string;
};

const Feature: React.FC<FeatureProps> = ({ icon: Icon, title, desc }) => (
  <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm hover:shadow-md transition-shadow ring-1 ring-primary/10">
    <div className="flex items-center gap-3 mb-2">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 via-sky-300/30 to-emerald-300/30"
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" aria-hidden="true" focusable={false} />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
    </div>
    <p className="text-[15px] text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

const FEATURES: FeatureProps[] = [
  {
    icon: Map,
    title: "Carte claire et fluide",
    desc: "Trouvez des spots rapidement selon votre position — zoom fluide, clustering et recherche rapide.",
  },
  {
    icon: PhoneIcon,
    title: "Pensé pour mobile",
    desc: "Menu simple, carte plein écran et ajout d’un spot en un clic — conçu pour une utilisation sur le terrain.",
  },
  {
    icon: Layers,
    title: "Calque des restrictions",
    desc: "Visualisez les zones réglementaires (no-fly, restrictions temporaires) et superposez/masquez les calques.",
  },
  {
    icon: ImageIcon,
    title: "Ajoutez vos spots",
    desc: "Photo, titre, description, tags — tout pour présenter un spot proprement et utilement.",
  },
  {
    icon: Share2,
    title: "Partage simple",
    desc: "Invitez des amis à collaborer ou partagez un lien public pour montrer vos meilleurs spots.",
  },
  {
    icon: Shield,
    title: "Contenu protégé",
    desc: "Gérez la visibilité de vos cartes : privées, partagées ou publiques — contrôle total sur qui voit quoi.",
  },
  {
    icon: Star,
    title: "Notations & avis",
    desc: "Notez les spots et lisez les avis pour choisir un lieu adapté à votre niveau et vos besoins.",
  },
  {
    icon: Users,
    title: "Cartes perso",
    desc: "Créez des collections : séparez spots par type, session ou zone — organisation flexible.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <ForceLightTheme />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-4">
            <LogoBrand size={64} className="h-16 w-16 shrink-0 self-center" />
            <span className="text-4xl md:text-5xl font-semibold tracking-tight leading-none">FlySpot</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight leading-tight bg-gradient-to-br from-primary to-sky-600 bg-clip-text text-transparent">
            Trouvez, notez et partagez les meilleurs spots de drone
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
            Carte claire et intuitive. Ajoutez un spot en un clic, créez des cartes perso et partagez-les avec
            vos amis ou la communauté.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <a
              href="/"
              aria-label="Ouvrir la carte FlySpot"
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 text-sm font-medium shadow-sm"
            >
              <Map className="w-4 h-4" /> Essayer FlySpot
            </a>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Feature key={f.title} {...f} />
        ))}
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border bg-card text-card-foreground p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-br from-primary/10 via-sky-100/40 to-emerald-100/40">
          <div>
            <div className="text-lg md:text-xl font-semibold">Envie d’essayer ?</div>
            <p className="text-sm text-muted-foreground">Ouvrez la carte ou créez votre première carte perso en quelques secondes.</p>
          </div>
          <a
            href="/"
            aria-label="Ouvrir l'application FlySpot"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
          >
            Ouvrir l'application
          </a>
        </div>
      </section>
    </div>
  );
}
