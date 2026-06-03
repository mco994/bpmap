# BPMap — monorepo

Monorepo npm workspaces. Trois packages :

- `web/` — application Next.js 16 (le site, ex-racine du repo). Garde tout le tooling d'ingestion (`web/scripts/`), la billetterie SEO, etc.
- `appMobile/` — application Expo / React Native (Android d'abord, iOS ensuite). Cross-platform, même base de code pour les deux stores.
- `shared/` — package `@bpmap/shared` : logique de domaine pure réutilisée par `web` et `appMobile` (types, filtres, helpers festivals) **et** les données (`shared/src/data/*.json`).

## Règles monorepo

- **Source unique de vérité du domaine** : tout ce qui est pur (types, filtrage, formatage, statut/cycle de vie, données festivals) vit dans `shared/`. Ne jamais dupliquer ces modules dans `web` ou `appMobile` — les importer via `@bpmap/shared`.
- **Données** : `shared/src/data/festivals.json` est généré par le pipeline d'ingestion (`web/scripts/`) à partir de `festivals.source.json`. Éditer la source, pas le JSON généré.
- **`web` consomme `@bpmap/shared`** via `transpilePackages` (source TS, pas de build préalable).
- Chaque package garde son propre `CLAUDE.md` / `AGENTS.md` pour ses spécificités (ex. `web/AGENTS.md` = règles Next.js 16).

## Commandes (depuis la racine)

- `npm run dev` / `npm run build` / `npm run lint` → délèguent à `web`.
- `npm run typecheck:shared` → typecheck du package partagé.
- App mobile : commandes dédiées dans `appMobile/` (voir son `CLAUDE.md`).
