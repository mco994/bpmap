# BPMap

L'annuaire et la **carte interactive des événements de musique électronique en France** — festivals, open airs et soirées. Filtres par type, genre, date, taille et prix, recherche tolérante aux fautes de frappe, pages SEO par genre, par région et par artiste.

Production : **https://bpmap.vercel.app**

## Monorepo

Trois espaces de travail npm :

| Paquet | Rôle |
|---|---|
| `web/` | Application **Next.js 16** (App Router, Turbopack, Tailwind 4) — le site public, les routes API et tout l'outillage d'ingestion (`web/scripts/`). |
| `appMobile/` | Application **Expo / React Native** (Android d'abord, iOS ensuite). |
| `shared/` | Paquet `@bpmap/shared` : la logique de domaine pure (types, filtres, recherche, cycle de vie, ICS, palette des genres, validation) **et** les données (`shared/src/data/*.json`). |

Règle du monorepo : tout ce qui est pur vit dans `shared/` et n'est **jamais** dupliqué dans `web` ou `appMobile`. `web` le consomme en source TypeScript via `transpilePackages`, sans build préalable.

## Démarrer

```bash
npm install
cp web/.env.local.example web/.env.local   # facultatif : tout a un repli
npm run dev                                 # http://localhost:3000
```

Aucune clé n'est nécessaire pour lancer le site : les tuiles OpenFreeMap ne demandent pas d'inscription et les données sont committées dans `shared/src/data/`.

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` / `npm run build` / `npm run lint` | délèguent à `web` |
| `npm run typecheck` | `@bpmap/shared` puis `web` |
| `npm test` / `npm run test:watch` | Vitest, à la racine (couvre `shared/` et `web/src`) |
| `npm run check:data` | contrôle d'intégrité du jeu de données committé |
| `npm run mobile` / `npm run mobile:android` | application Expo |

Depuis `web/` : `npm run geocode`, `npm run ingest`, `npm run verify-promote`, `npm run db:migrate`, `npm run db:load`, `npm run build:genre-css`, `npm run smoke`.

## Pipeline de données

`shared/src/data/festivals.json` est **généré** : éditer `festivals.source.json`, jamais le JSON produit.

Le workflow [« Mise à jour quotidienne des festivals »](.github/workflows/daily-update.yml) tourne chaque jour à 05:00 UTC :

```
ingestion multi-sources   Wikidata · OpenAgenda · Resident Advisor · DICE · DATAtourisme
        ↓
vérification croisée      ≥ 2 domaines sources, ou site officiel confirmé
        ↓
enrichissement            line-ups RA, prix et line-ups Shotgun
        ↓
géocodage                 API Base Adresse Nationale
        ↓
contrôle d'intégrité      formes, doublons, coordonnées, dates, URL, perte massive
        ↓
journal des changements   diff avec la version committée → changes.json
        ↓
lint · types · tests · build
        ↓
Neon                      migrations, chargement, cycle de vie, notifications push
        ↓
PR de rafraîchissement    statut publié sur le commit, auto-merge
```

Le job n'utilise **aucun secret d'authentification Git** : il pousse avec le `GITHUB_TOKEN` natif et publie lui-même le statut requis après avoir réellement exécuté les vérifications. Seuls `CONNECTION_STRING` (Neon) et `DATATOURISME_FLUX_URL` sont des secrets, et les étapes qui en dépendent échouent proprement en leur absence.

## Qualité

- **Vitest** — le domaine partagé est couvert : filtrage, recherche approximative, statuts, diff de changements, ICS, regroupements, slugs, validation du jeu de données, contraste de la palette.
- **CI** — lint, typecheck des trois paquets, tests, intégrité des données, synchronisation de la palette avec `globals.css`, build.
- **`npm run smoke`** — pilote un Chromium sans interface sur un build servi (`npm run start`) et rapporte erreurs console, requêtes échouées et en-têtes de sécurité route par route.
- **Accessibilité** — cible WCAG AA. Les pastilles de genre sont verrouillées à 4,5:1 par un test, dans les deux thèmes.
- **Sécurité** — en-têtes définis dans `web/next.config.ts`, requêtes Postgres paramétrées, TLS vérifié, URL issues de l'ingestion assainies avant rendu.
