# BPMap — application web

Application Next.js 16 du monorepo. Voir le [README racine](../README.md) pour la vue d'ensemble et le pipeline de données.

## Stack

- **Next.js 16** — App Router, composants serveur, Turbopack
- **React 19**, **TypeScript** en mode strict
- **Tailwind CSS 4**
- **MapLibre GL** via `react-map-gl/maplibre` — tuiles [OpenFreeMap](https://openfreemap.org), sans clé
- **Neon** (Postgres serverless) — abonnements aux notifications push et miroir du catalogue
- **@vercel/firewall** — limitation de débit sur les routes API

## Structure

```
src/
  app/
    page.tsx                     carte + filtres + recherche
    festivals/page.tsx           sommaire (liste, mosaïque, agenda)
    festivals/[slug]/            fiche événement, image Open Graph
    genres/, regions/, artistes/ pages SEO générées
    nouveautes/                  journal des changements
    suivis/                      suivis locaux (noindex)
    api/                         festivals, changes, signaler, push/register
    sitemap.ts, robots.ts, manifest.ts
  components/                    carte, filtres, recherche, cartes, modales
  lib/
    site.ts                      URL canonique + sérialisation JSON-LD sûre
    db.ts                        pool Postgres partagé
    rate-limit.ts                garde @vercel/firewall
    favorites.ts, followed-artists.ts, use-dialog.ts, geo.ts, affiliate.ts
  __tests__/                     tests propres à web
scripts/                         ingestion, géocodage, base, contrôles, smoke
migrations/                      SQL Neon, appliqué par db-migrate.mjs
```

Les types, le filtrage, la recherche, le formatage, la palette des genres et les données vivent dans `@bpmap/shared` — ne rien redéfinir ici.

## Scripts

| Commande | Effet |
|---|---|
| `dev` · `build` · `start` · `lint` · `typecheck` | cycle standard |
| `ingest` | ingestion multi-sources → `festivals.candidates.json` |
| `verify-promote` | vérification croisée puis promotion vers `festivals.source.json` |
| `ra-lineups` · `fb:update` | enrichissement des line-ups |
| `geocode` | géocodage BAN → régénère `festivals.json` |
| `db:migrate` · `db:load` · `db:lifecycle` · `db:check` | Neon |
| `build:genre-css` · `check:genre-css` | régénère ou vérifie la palette dans `globals.css` |
| `smoke` | vérification navigateur sur un build servi |

`smoke` attend un serveur déjà lancé :

```bash
npm run build && npm run start -- -p 3111 &
node scripts/smoke.mjs / /festivals /festivals/le-bon-air
```

## Variables d'environnement

Voir [`.env.local.example`](.env.local.example). Aucune n'est obligatoire en développement.

`NEXT_PUBLIC_SITE_URL` pilote les URL canoniques, le sitemap et l'Open Graph. Sans elle, `VERCEL_PROJECT_PRODUCTION_URL` prend le relais sur Vercel, puis `http://localhost:3000`. La définir explicitement le jour d'un domaine propre.

## Next.js 16

Cette version comporte des ruptures par rapport aux connaissances d'entraînement : lire le guide concerné dans `node_modules/next/dist/docs/` avant d'écrire du code (voir [`AGENTS.md`](AGENTS.md)).
