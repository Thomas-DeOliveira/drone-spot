import { Metadata } from "next";
import Image from "next/image";
import LogoBrand from "../(components)/LogoBrand";
import { Map, Layers, Share2, Shield, Image as ImageIcon, Users, Lock, Globe, Sparkles, Plus, Star } from "lucide-react";
import ForceLightTheme from "../(components)/providers/ForceLightTheme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FlySpot – À propos",
  description: "Présentation des fonctionnalités de FlySpot: cartes perso, partage, zones drones, clustering, mobile, et plus.",
};

export default function AboutPage() {
  const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm hover:shadow-md transition-shadow ring-1 ring-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl text-primary flex items-center justify-center bg-gradient-to-br from-primary/20 via-sky-300/30 to-emerald-300/30 dark:from-primary/20 dark:via-sky-500/20 dark:to-emerald-500/20">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      <p className="text-[15px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background">
      <ForceLightTheme />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-3">
            <LogoBrand size={56} className="h-14 w-14" />
            <span className="text-2xl md:text-3xl font-semibold tracking-tight">FlySpot</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight leading-tight bg-gradient-to-br from-primary to-sky-600 dark:to-sky-400 bg-clip-text text-transparent">
            Découvrez et partagez vos meilleurs spots de drone
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
            Une carte simple et jolie. Ajoutez vos spots, créez vos cartes perso, partagez en un clic.
          </p>
          <div className="mt-6 flex items-center justify-between gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 text-sm font-medium shadow-sm"
            >
              <Map className="w-4 h-4" /> Ouvrir la carte
            </a>
            {/* Pas de bascule de thème sur /about */}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Feature
          icon={Map}
          title="Carte claire et fluide"
          desc="Trouvez des spots en un coup d’œil. Les points proches se regroupent automatiquement. Fonctionne très bien sur mobile."
        />
        <Feature
          icon={Layers}
          title="Zones drones visibles"
          desc="Affichez les zones de restrictions officielles pour voler en sécurité. Activez/masquez quand vous voulez."
        />
        <Feature
          icon={ImageIcon}
          title="Ajoutez vos spots"
          desc="Photo, titre, description, tags… Tout ce qu’il faut pour présenter votre spot proprement."
        />
        <Feature
          icon={Users}
          title="Cartes perso"
          desc="Créez vos propres cartes. Rangez vos spots comme vous aimez."
        />
        <Feature
          icon={Share2}
          title="Partage simple"
          desc="Invitez des amis (lecture ou modification) ou partagez un lien public en lecture seule."
        />
        <Feature
          icon={Shield}
          title="Contenu protégé"
          desc="Vos cartes privées restent privées. Personne ne voit vos spots sans y être invité."
        />
        <Feature
          icon={Lock}
          title="Droits au choix"
          desc="Lecture seule ou modification. À vous de décider pour chaque personne."
        />
        <Feature
          icon={Globe}
          title="Pensé pour mobile"
          desc="Menu simple, carte plein écran, ajout de spot au toucher."
        />
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border bg-card text-card-foreground p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-br from-primary/10 via-sky-100/40 to-emerald-100/40 dark:from-primary/10 dark:via-sky-500/10 dark:to-emerald-500/10">
          <div>
            <div className="text-lg md:text-xl font-semibold">Envie d’essayer ?</div>
            <p className="text-sm text-muted-foreground">Ouvrez la carte, ou créez votre première carte perso en quelques secondes.</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
          >
            Ouvrir l'application
          </a>
        </div>
      </section>
    </div>
  );
}


