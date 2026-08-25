# BPMap — monorepo

Monorepo npm workspaces. Trois packages :

- `web/` — application Next.js 16 (le site, ex-racine du repo). Garde tout le tooling d'ingestion (`web/scripts/`), la billetterie SEO, etc.
- `appMobile/` — application Expo / React Native (Android d'abord, iOS ensuite). Cross-platform, même base de code pour les deux stores.
- `shared/` — package `@bpmap/shared` : logique de domaine pure réutilisée par `web` et `appMobile` (types, filtres, helpers festivals) **et** les données (`shared/src/data/*.json`).

## Règles monorepo

- **Source unique de vérité du domaine** : tout ce qui est pur (types, filtrage, formatage, statut/cycle de vie, palette des genres, validation, données festivals) vit dans `shared/`. Ne jamais dupliquer ces modules dans `web` ou `appMobile` — les importer via `@bpmap/shared`.
- **Données** : `shared/src/data/festivals.json` est généré par le pipeline d'ingestion (`web/scripts/`) à partir de `festivals.source.json`. Éditer la source, pas le JSON généré.
- **`shared/src/dataset.ts` est le seul module qui importe `festivals.json`.** Les helpers purs restent dans `festivals.ts`, sans import de données : c'est ce qui garde le jeu de données hors du bundle client. Ne pas réintroduire d'accès au dataset depuis un module importé par un composant client.
- **`web` consomme `@bpmap/shared`** via `transpilePackages` (source TS, pas de build préalable).
- Chaque package garde son propre `CLAUDE.md` / `AGENTS.md` pour ses spécificités (ex. `web/AGENTS.md` = règles Next.js 16).

## Commandes (depuis la racine)

- `npm run dev` / `npm run build` / `npm run lint` → délèguent à `web`.
- `npm run typecheck` → `@bpmap/shared` puis `web`. `npm run typecheck:shared` pour le seul package partagé.
- `npm test` / `npm run test:watch` → Vitest à la racine, couvre `shared/src/__tests__` et `web/src/__tests__`.
- `npm run check:data` → contrôle d'intégrité du jeu de données committé.
- App mobile : commandes dédiées dans `appMobile/` (voir son `CLAUDE.md`).

## Points de vigilance

- **Palette des genres** : `shared/src/genre-colors.ts` est la source, `web/src/app/globals.css` en est la projection générée par `npm run build:genre-css --workspace web`. La CI vérifie la synchronisation, et un test verrouille le contraste à 4,5:1 dans les deux thèmes. Ne pas modifier les couleurs sans relancer le générateur.
- **URL canonique** : jamais de `process.env.NEXT_PUBLIC_SITE_URL` en dur dans une page — passer par `@/lib/site`.
- **JSON-LD** : toujours sérialiser via `inlineJson`, jamais `JSON.stringify`. Les noms d'événements viennent d'une ingestion automatique de sources tierces.
- **URL issues des données** : `sanitizeUrl` / `isHttpUrl` avant tout rendu dans un `href`.
- **Job quotidien** : il ne dépend d'aucun secret Git. Il pousse avec le `GITHUB_TOKEN` natif et publie lui-même le statut requis `Web — lint · types · build` après avoir exécuté les vérifications. Si le nom du check requis change dans les réglages du dépôt, mettre à jour `REQUIRED_CHECK_CONTEXT` dans `daily-update.yml`.
