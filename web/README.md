# BPMap

L'annuaire et la **carte interactive des festivals de musique électronique français** (techno, house, drum'n'bass, French touch…). Filtres par genre, date, organisateur, taille et prix (jour / pass complet).

> MVP. Le périmètre actuel = festivals multi-jours en France. Pensé **web-first** (desktop + mobile responsive), avec SEO, accessibilité et performance comme contraintes de premier ordre.

## Stack

- **Next.js 16** (App Router, RSC, Turbopack) + TypeScript
- **Tailwind CSS 4**
- **MapLibre GL** via `react-map-gl/maplibre` — tuiles gratuites [OpenFreeMap](https://openfreemap.org) (aucune clé API)
- **Supabase** (Postgres + PostGIS) — câblé pour la suite, voir « Données » ci-dessous

## Démarrer

```bash
npm install
cp .env.local.example .env.local   # optionnel pour le MVP
npm run dev                         # http://localhost:3000
```

Aucune configuration n'est requise pour lancer le MVP : la carte tourne avec les
tuiles OpenFreeMap par défaut et les données proviennent du seed statique.

Scripts : `npm run dev` · `npm run build` · `npm run start` · `npm run lint`

## Données

- **MVP (actuel)** : source de vérité = seed statique typé dans
  [`src/data/festivals.ts`](src/data/festivals.ts). ⚠️ Données *indicatives* (dates,
  prix, capacités, coordonnées ville) à vérifier avant prod.
- **Cible** : table `festivals` Supabase (schéma dans
  [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
  aligné sur `src/lib/types.ts`), peuplée par un pipeline d'ingestion.

### Stratégie de collecte (à venir)

Agrégation multi-sources → normalisation → géocodage (BAN) → dédoublonnage →
classification des genres → upsert avec provenance, puis curation communautaire :

1. **Open data** : DATAtourisme (API officielle, mars 2026), OpenAgenda, Wikidata.
2. **Électro-spécifique** : Resident Advisor (genres/line-ups), Shotgun (FR, billetterie/affiliation).
3. **Enrichissement** : genres via line-up (MusicBrainz/Last.fm), taille via capacité.
4. **Communauté** : soumissions + modération.

## Structure

```
src/
  app/
    page.tsx                  # accueil : carte + filtres + liste
    festivals/[slug]/page.tsx # fiche festival (SSG + JSON-LD MusicEvent)
    sitemap.ts, robots.ts
  components/
    Explorer.tsx              # état filtres/sélection (client)
    Map.tsx                   # carte MapLibre (client-only)
    Filters.tsx               # panneau de filtres
    FestivalCard.tsx          # carte de la liste (alternative a11y à la carte)
  lib/
    types.ts, festivals.ts    # types + accès données + helpers
    filters.ts                # logique de filtrage partagée
    supabase.ts               # client (pour la suite)
  data/festivals.ts           # seed
```

## Roadmap (post-MVP)

Vue agenda/liste · pipeline d'ingestion · alertes (auth + push PWA) ·
soumissions communautaires · affiliation billetterie · extension du périmètre
(open airs / raves).
