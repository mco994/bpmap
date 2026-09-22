# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Public francophone cherchant des événements de musique électronique en France : festivals, open airs et soirées (README).
- Utilisateurs mobiles via l'application Expo / React Native, Android d'abord, iOS ensuite (CLAUDE.md, README).
- Utilisateurs qui suivent des événements et reçoivent des notifications push : liste « Mes suivis » stockée sur l'appareil, enregistrement de jetons Expo Push côté serveur (déduit du dépôt).
- Visiteurs signalant une erreur sur une fiche via la route `api/signaler` (déduit du dépôt).

## Product Purpose

BPMap est l'annuaire et la carte interactive des événements de musique électronique en France (README). Le produit agrège automatiquement des sources tierces, les croise, les enrichit, les géocode, puis les publie chaque jour sur le site et l'application mobile (README, pipeline quotidien).

## Positioning

- Un point d'entrée unique, filtrable, pour l'ensemble des festivals et soirées électro français, avec pages SEO par genre, par région et par artiste (README).
- Données ouvertes et retraçables : ingestion multi-sources (Wikidata, OpenAgenda, Resident Advisor, DICE, DATAtourisme), page publique « Sources & licences » (README ; page `web/src/app/sources/page.tsx`).
- Aucune clé ni inscription nécessaire pour faire tourner le site : tuiles OpenFreeMap, données committées dans le dépôt (README).

## Operating Context

- Production : https://bpmap.vercel.app (README).
- Monorepo npm workspaces : `web/` (Next.js 16, App Router, Tailwind 4), `appMobile/` (Expo / React Native), `shared/` (`@bpmap/shared`, logique de domaine pure et données JSON) (CLAUDE.md, README).
- Base de données Neon (PostgreSQL) pour les migrations, le cycle de vie et les notifications push ; les étapes dépendantes échouent proprement sans secret (README).
- Job quotidien GitHub Actions à 05:00 UTC : ingestion, vérification croisée, enrichissement, géocodage (Base Adresse Nationale), contrôle d'intégrité, journal des changements, puis PR de rafraîchissement auto-fusionnée (README, CLAUDE.md).
- Carte rendue avec MapLibre GL (`maplibre-gl`, `react-map-gl` côté web, `@maplibre/maplibre-react-native` côté mobile) (déduit du dépôt).

## Capabilities and Constraints

Capacités :
- Carte interactive et filtres par type, genre, date, taille et prix ; recherche tolérante aux fautes de frappe (README).
- Pages SEO : `/festivals`, `/genres`, `/regions`, `/artistes` avec fiches par slug ; `/nouveautes` pour le journal des changements ; `/suivis` pour la liste personnelle (déduit du dépôt).
- Export ICS et regroupements fournis par le domaine partagé (README).
- Routes API : `api/festivals`, `api/changes`, `api/push/register`, `api/signaler` (déduit du dépôt).
- Application mobile Expo avec géolocalisation, notifications et stockage local (déduit du dépôt).

Contraintes :
- Un événement n'est publié qu'après vérification croisée : au moins deux domaines sources, ou site officiel confirmé (README).
- Le jeu de données `festivals.json` est généré : on édite `festivals.source.json`, jamais le JSON produit (CLAUDE.md, README).
- La logique pure vit uniquement dans `shared/` et n'est jamais dupliquée dans `web` ou `appMobile` (CLAUDE.md).
- Les URL issues de l'ingestion sont assainies avant tout rendu ; le JSON-LD est sérialisé via `inlineJson` (CLAUDE.md).
- Les routes API publiques sont rate-limitées via `@vercel/firewall` (déduit du dépôt).

## Brand Commitments

- Exhaustivité et fraîcheur : mise à jour quotidienne automatisée de l'ensemble du catalogue (README).
- Transparence sur l'origine des données : sources tierces citées, page « Sources & licences », fonction de signalement d'erreur (README ; déduit du dépôt pour le signalement).
- Respect de la vie privée : liste de suivis stockée sur l'appareil, page `/confidentialite` et `/mentions-legales` (déduit du dépôt).
- Accessibilité visée WCAG AA, pastilles de genre verrouillées à 4,5:1 dans les deux thèmes par un test (README, CLAUDE.md).

## Evidence on Hand

- Documentation : `C:\Users\marin\Work\BPMap\CLAUDE.md`, `C:\Users\marin\Work\BPMap\README.md`, `web/AGENTS.md`, `appMobile/AGENTS.md`.
- Données committées : `shared/src/data/festivals.json` (57 entrées au moment de la rédaction, déduit du dépôt), `festivals.source.json`, `lineups.json`, `prices.json`, `dates.json`, `descriptions.json`, `changes.json`.
- Routes : `web/src/app/**/page.tsx` et `web/src/app/api/**/route.ts`.
- Qualité : tests Vitest dans `shared/src/__tests__` et `web/src/__tests__`, CI (lint, typecheck, tests, intégrité des données, synchronisation palette, build), script `npm run smoke` (README).
- Absences à ne pas fabriquer : aucun témoignage utilisateur, aucun chiffre d'audience, aucun tarif ni modèle économique, aucun nom de partenaire commercial dans le dépôt. Aucun skill de marque (`.claude/skills/*-brand`) n'existe.

## Product Principles

1. Une seule source de vérité : le domaine et les données vivent dans `shared/`, consommés tels quels par le web et le mobile (CLAUDE.md).
2. Ne publier que du vérifié : vérification croisée multi-sources et contrôle d'intégrité avant chaque mise à jour (README).
3. Automatiser sans secret superflu : le job quotidien ne dépend d'aucun secret Git et échoue proprement sans base (README, CLAUDE.md).
4. Sécurité par défaut : en-têtes définis dans `next.config.ts`, requêtes paramétrées, URL tierces assainies, rate-limiting des API (README ; déduit du dépôt pour le rate-limiting).
5. Fonctionner hors ligne de tout compte : le site se lance sans clé, les suivis restent sur l'appareil (README ; déduit du dépôt pour les suivis).

## Accessibility & Inclusion

- Cible WCAG AA déclarée (README).
- Contraste des pastilles de genre verrouillé à 4,5:1 dans les thèmes clair et sombre par un test automatisé ; la palette `shared/src/genre-colors.ts` est la source et `globals.css` sa projection vérifiée en CI (CLAUDE.md, README).
- Interface et contenus en français (déduit du dépôt).
