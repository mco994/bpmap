# BPMap — app mobile (Expo / React Native)

Version native (Android d'abord, iOS ensuite) de BPMap. Cross-platform, même base de code pour les deux stores. Toute la logique de domaine (types, filtres, données festivals) vient du package partagé `@bpmap/shared`.

## Stack

- Expo SDK 56 + Expo Router (TypeScript, `src/app`)
- MapLibre RN v11 (carte, style OpenFreeMap *positron* — gratuit, sans clé, aligné sur le web)
- `expo-notifications` (rappels locaux), `expo-location` (itinéraires, à venir)
- `@react-native-async-storage/async-storage` (favoris hors-ligne)

> MapLibre est un **module natif** → l'app ne tourne **pas dans Expo Go**. Il faut un *dev build* (ci-dessous).

## Développement

```bash
npm run mobile            # depuis la racine du monorepo (= expo start)
# ou, dans appMobile/ :
npx expo start --dev-client
```

## Tester sur ton téléphone — SANS rien toucher au store (Phase 4A)

Build dans le cloud EAS, à installer toi-même. Étape interactive à faire une fois :

```bash
npm i -g eas-cli      # si pas déjà installé
eas login             # compte Expo gratuit (interactif)
```

Puis, depuis `appMobile/` :

```bash
# APK autonome à installer en sideload sur le tel (le plus simple pour tester)
eas build --profile preview --platform android

# OU dev build (hot reload + débogage), à appairer avec `npx expo start --dev-client`
eas build --profile development --platform android
```

EAS renvoie une URL : télécharge le `.apk` sur le téléphone et installe-le (autoriser les sources inconnues). Aucun compte Play, aucune signature de store, aucune fiche.

Alternative 100 % locale (si Android Studio + SDK installés) :

```bash
npx expo run:android
```

## Google Play (Phase 4B — plus tard, sur GO)

```bash
eas build --profile production --platform android   # AAB signe
eas submit --platform android                        # vers Play Console
```

Nécessite un compte Google Play Developer (25 $ une fois), une fiche store et une politique de confidentialité.

## iOS (post-op)

Même code. Nécessite un compte Apple Developer (99 $/an) + certificats/provisioning (le « tampon »). `eas build --platform ios` une fois ces identifiants en place.
