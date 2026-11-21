# Aahaarloop — ce qu'il reste à faire

Runbook mis à jour le 2026-11-22. Cochez chaque étape au fur et à mesure.

## État actuel (déjà fait)

- [x] Neon : projet `wandering-salad-27205996`, organisation `org-weathered-queen-10917366`, branche `production`.
- [x] `neon init` + `neon deploy` : `neon.ts` commité (PR #151), services Postgres et AI Gateway actifs.
- [x] 7 variables Neon récupérées dans `.env.local` (racine et `apps/web/`, gitignorés).
- [x] Postgres : connexion vérifiée, migrations appliquées sur `production`.
- [x] AI Gateway : câblé dans le code, route `/api/ai/models` opérationnelle en mode dégradé (aucun appel payant).
- [x] Build complet `npm run build` : 6 tâches réussies.
- [x] PWA (#53), service worker (#54), QR code (#69), audit perf (#73), offline web/mobile (#55/#56/#63/#64-logique) livrés.

---

## Étape 1 — Récupérer les clés manquantes

Ces valeurs ne sont **pas** dans le dépôt et ne peuvent pas être devinées.

- [ ] **Google OAuth** — dans [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Identifiants → ID client OAuth 2.0 :
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - Autoriser les URI de redirection :
    - `http://localhost:3000/api/auth/callback/google`
    - `https://aahaarloop.vercel.app/api/auth/callback/google`
    - `https://<chaque-preview-host>/api/auth/callback/google`

- [ ] **Cloudinary** — dans le dashboard Cloudinary → API Keys :
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET` (serveur uniquement, jamais de préfixe `NEXT_PUBLIC_`)

- [ ] **Expo** — sur [expo.dev](https://expo.dev/settings/access-tokens), créer un token et l'ajouter comme secret GitHub `EXPO_TOKEN` (nécessaire au workflow `.github/workflows/apk-release.yml`).

- [ ] **AUTH_SECRET** — une valeur a été générée localement dans `.env.local`. Si vous voulez la vôtre :
  ```sh
  openssl rand -base64 32
  ```

Déjà disponibles, aucun geste nécessaire : `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `DIRECT_URL`, `NEON_BRANCH`, `NEON_BRANCH_ID`, `NEON_FUNCTION_HOST_SUFFIX`, `NEON_AI_GATEWAY_TOKEN`, `NEON_AI_GATEWAY_BASE_URL`, `NEXT_PUBLIC_APP_URL=https://aahaarloop.vercel.app`, `EXPO_PUBLIC_API_URL`.

---

## Étape 2 — AI Gateway sans achat (mode dégradé)

Aucun achat n'est nécessaire. Le compte Neon n'a pas de crédits AI Gateway : les 68 modèles du catalogue sont listés mais `enabled: false`, et tout appel de complétion renvoie `403 paid_plan_required`.

**Comportement retenu : aucune dépense, aucune erreur cassante.**

- [x] `GET /api/ai/models` est un contrôle **gratuit** : il ne fait que lister les modèles et renvoie désormais :
  ```json
  {
    "ok": true,
    "available": false,
    "modelCount": 68,
    "enabledCount": 0,
    "reason": "paid_plan_required"
  }
  ```
- [x] Le client `chatCompletion()` lève une erreur typée `GatewayUnavailableError` sur `403 paid_plan_required` — l'interface peut donc afficher « IA indisponible » sans tenter de retry ni planter.
- [x] Aucun autre service ne dépend de l'IA : l'essentiel de l'application (dons, claims, matching, logistique, offline) fonctionne uniquement avec Postgres.

À faire uniquement **si plus tard** vous obtenez des crédits : `available` passera à `true` et vous pourrez alors appeler `chatCompletion()` avec un modèle activé. Ce n'est **pas** un prérequis de la démo.

## Étape 3 — Déployer sur Vercel (issue #74 — FAIT)

- [x] Projet Vercel `aahaarloop` lié et déployé sur https://aahaarloop.vercel.app.
- [ ] Framework : **Next.js**. Build command : `pnpm --filter @aahaarloop/web build`. Output : `apps/web/.next`. (Alternative : Root Directory `apps/web`.)
- [ ] Node : `.nvmrc` (≥ 22.18), pnpm détecté via `packageManager` dans `package.json`.
- [x] 11 variables Neon + AUTH_SECRET ajoutées en Production et Preview via `vercel env add`. **Manquant** : Google OAuth et Cloudinary (à ajouter dès que vous me les donnez ou via le dashboard).
- [ ] **Important** : les previews pointent aujourd'hui vers la même branche Neon `production`. Créer une branche Neon par preview et lui donner ses propres `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET`.
- [x] Déployé puis vérifié : `/api/health/db` → `{"ok":true}`, `/api/ai/models` → `available:false`.
  ```sh
  curl https://aahaarloop.vercel.app/api/health/db    # {"ok":true}
  curl https://aahaarloop.vercel.app/api/ai/models    # count > 0
  ```

---

## Étape 4 — Corriger les trois dettes connues

- [ ] `pnpm db:check`, `db:migrate`, `db:seed` échouent tels quels : Node ne lit pas `.env.local` automatiquement. Ajouter `--env-file=.env.local` dans `scripts/*.mjs` (ou un chargeur d'env). Forme qui marche aujourd'hui :
  ```sh
  node --env-file=.env.local scripts/check-db.mjs
  cd packages/database && node --env-file=../../.env.local scripts/migrate.mjs
  ```
- [ ] Compléter `docs/development/environment.md` : les 3 variables Cloudinary y manquent.
- [ ] Performance : LCP 3,2 s / TBT 790 ms au-dessus des cibles. Voir `docs/performance-audit.md`. Prévoir le lazy-load de la carte quand #42 sera fait.

---

## Étape 5 — Review et merge des PR en attente

- [x] PR #144 fermée (supplantée par le dashboard du redesign, issue #17 close).
- [x] PR #145 mergée (favoris, issue #37 close).
- [x] PR #155 mergée (correctif lint mobile qui bloquait toute la CI).

Vérifier les deux trailers de co-auteur sur chaque commit avant merge.

---

## Étape 6 — Issues restantes (13), ordre suggéré

**P0 — avant la démo**

- [x] #72 données + script de démo (PR #154, `docs/demo-script.md`).
- [x] #74 Vercel (étape 3).
- [x] #77 checklist finale / mapping des critères (PR #156, `docs/demo-checklist.md`).

**Logistique**

- [ ] #40 missions volontaire + acceptation
- [ ] #42 carte Leaflet + clustering (et lazy-load, voir étape 4)
- [x] #43 workflow de ramassage
- [x] #44 livraison avec preuve + impact (PR #162, `deliveryService`)
- [ ] #45 timeline de suivi + ETA

**Mobile**

- [ ] #60 auth + onboarding par rôle
- [ ] #61 parcours dons / claims
- [ ] #62 caméra native + upload
- [ ] #64 reste : écran de résolution de conflits (la logique est déjà livrée)
- [ ] #65 enregistrement du token push (la permission existe déjà)
- [ ] #66 parcours mission volontaire + carte

**Web / admin / matching**

- [ ] #47 analytics et graphiques d'impact
- [ ] #57 détection/résolution de conflits (UI)
- [ ] #58 états UX hors-ligne

**Qualité / docs**

- [x] #71 stratégie de tests
- [x] #75 monitoring production
- [x] #76 documentation des routes API

---

## Étape 7 — Vérifications finales sur le déployé

- [ ] Connexion Google réelle (sign-in → onboarding → rôle)
- [ ] Upload d'image Cloudinary depuis le formulaire de don
- [ ] Vérifier que l'UI affiche proprement l'indisponibilité de l'IA (`available:false`) sans erreur bloquante
- [ ] Mode hors-ligne + prompt d'install PWA + mise à jour du service worker dans un navigateur
- [ ] Build EAS et installation de l'APK sur un vrai Android, scan du QR #69 au stand
- [ ] Parcours de conflit de bout en bout une fois #57/#64 faits
- [ ] Lighthouse après déploiement (objectifs dans `docs/performance-audit.md`)
- [ ] Répéter le script de démo #72 sur l'environnement Vercel

---

## Commandes utiles

```sh
# Vérifier la DB et le gateway
node --env-file=.env.local scripts/check-db.mjs
curl -s http://localhost:3000/api/health/db
curl -s http://localhost:3000/api/ai/models

# Neon
neon status
neon config plan
neon env pull
neon checkout dev --create      # branche de preview

# Qualité
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
npm run build
```
