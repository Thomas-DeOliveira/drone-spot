# Drone Spots (Next.js 14, App Router)

Application simple pour afficher une carte plein écran avec des spots de drone et permettre aux utilisateurs authentifiés d'ajouter de nouveaux spots.

## Stack
- Next.js (App Router)
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (Google ou Email)
- React-Leaflet + Leaflet

## Prérequis
- Node.js 18+
- PostgreSQL (local ou Docker)

### Option Docker (recommandée pour dev)
```bash
docker run --name drone-spot-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=drone_spot -p 5432:5432 -d postgres:16
```

## Installation
```bash
npm install
cp .env.example .env
```

Editez `.env` :
- `DATABASE_URL` (ex: `postgresql://postgres:postgres@localhost:5432/drone_spot?schema=public`)
- `NEXTAUTH_URL` (ex: `http://localhost:3000`)
- `NEXTAUTH_SECRET` (générez une chaîne aléatoire)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (facultatif si vous utilisez Email)
- `EMAIL_SERVER` et `EMAIL_FROM` (facultatif si vous utilisez Email)

## Prisma
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## Démarrer
```bash
npm run dev
```
Ouvrez `http://localhost:3000`.

## Fonctionnalités
- Carte plein écran (OpenStreetMap + Leaflet) avec marqueurs cliquables
- Authentification NextAuth (Google ou Email)
- Formulaire d'ajout de spot (titre, description, latitude, longitude)

## Structure
- `src/app/page.tsx` : page carte (SSR) affichant les spots depuis la DB
- `src/app/spots/new/page.tsx` : formulaire d'ajout (protégé)
- `src/app/api/spots/route.ts` : API GET/POST spots
- `src/app/api/auth/[...nextauth]/route.ts` : NextAuth
- `src/lib/prisma.ts` : client Prisma
- `src/lib/auth.ts` : configuration NextAuth (v4)

## Notes
- Si la carte n'affiche pas les icônes, nous chargeons l'icône Leaflet par URL (CDN). Vous pouvez migrer vers des assets locaux si besoin.
- En prod, configurez des providers NextAuth réels (Google/SMTP) et un `NEXTAUTH_SECRET` fort.
