# Banking sync — Cloudflare Worker + Enable Banking

Tiny worker that lets the PWA pull transactions from your bank via the
Enable Banking API (free PSD2 aggregator covering most EU banks).

```
[iPhone PWA] ──HTTPS──▶ [Cloudflare Worker] ──JWT/PSD2──▶ [Enable Banking] ──▶ [ta banque]
```

Setup : ~20 min, tout gratuit, depuis ton iPhone.

## Pré-requis

- Tu as déjà :
  - Une application Enable Banking créée (tu as son **Application ID** et le
    fichier **`.pem`** de clé privée téléchargé).
  - La PWA déployée sur GitHub Pages (URL publique du type
    `https://<user>.github.io/<repo>/`).

## 1. Crée un compte Cloudflare

1. https://dash.cloudflare.com/sign-up → inscris-toi (gratuit, pas de CB).
2. Valide l'email.

## 2. Crée le KV namespace

1. Dashboard Cloudflare → **Workers & Pages** (menu de gauche) → **KV**.
2. **Create a namespace** → nom : `banking-sync`. Valide.
3. Note l'ID affiché (tu n'en auras pas besoin via l'UI, juste utile si tu
   passes en CLI plus tard).

## 3. Crée le Worker

1. Dashboard → **Workers & Pages** → **Create application** →
   **Create Worker**.
2. Nom : `banking-sync`. **Deploy** avec le code par défaut.
3. Sur la page du worker, onglet **Edit code** (ou « Quick edit »).
4. Supprime tout, colle le contenu de `worker/worker.js` de ce dossier.
5. **Save and deploy**.

## 4. Bind le KV

1. Worker → **Settings** → **Variables and Secrets** →
   section **KV Namespace Bindings** → **Add binding**.
2. Variable name : `KV`
   KV namespace : celui créé à l'étape 2.
3. **Save**.

## 5. Ajoute les variables et secrets

Worker → **Settings** → **Variables and Secrets** → **Add** :

Deux **variables** (type *Plain text*) :

| Nom | Valeur |
| --- | --- |
| `APP_ID` | ton Application ID Enable Banking (UUID, p.ex. `94ff9e4f-8116-4809-8d4e-0527cc6b2503`) |
| `PWA_URL` | URL publique de la PWA, exactement identique à la *redirect URL* déclarée dans Enable Banking (ex. `https://mathiasrouvin-cmd.github.io/App-iOS-/` avec le `/` final) |

Deux **secrets** (type *Secret*) :

| Nom | Valeur |
| --- | --- |
| `APP_SECRET` | une chaîne aléatoire longue (50+ caractères, https://www.random.org/strings par exemple). **Colle la même valeur côté PWA** dans Réglages → Synchronisation banque. |
| `APP_PRIVATE_KEY` | **le contenu entier** du fichier `.pem` Enable Banking : ouvre-le dans Fichiers, copie tout (en-tête `-----BEGIN PRIVATE KEY-----` + clé + `-----END PRIVATE KEY-----`, newlines comprises) et colle-le. |

**Save and deploy**.

## 6. Récupère l'URL du worker

En haut de la page du worker, tu vois :
`https://banking-sync.<ton-compte>.workers.dev`

Copie-la.

## 7. Configure la PWA

Ouvre la PWA, onglet **Réglages** → section **Synchronisation banque** :

- **URL du worker** : colle l'URL du worker.
- **Jeton d'auth** : colle `APP_SECRET` (la même valeur qu'à l'étape 5).
- **Tester** → doit afficher « OK ».
- **Lier une banque** → choisis ta banque dans la liste.
- Tu es redirigé vers le parcours Enable Banking → banque → consentement.
- Retour automatique dans la PWA, les comptes apparaissent.
- **Synchroniser maintenant** → les 90 derniers jours sont pull.

---

## Quotas & limites

- **Enable Banking** (plan Starter gratuit) : usage perso, comptes du propriétaire
  uniquement (c'est ce qui est activé par « Activate by linking accounts »).
- **Consentement bancaire** : 180 jours max (règle PSD2), après quoi il faut
  relier la banque.
- **Cloudflare Workers free** : 100 000 req/jour, 10 ms CPU/req. Large marge.

## Sécurité

- La **clé privée RSA** est stockée comme *Secret* Cloudflare (chiffré au repos,
  pas exposé dans les logs).
- La PWA ne voit jamais la clé ; elle dialogue avec le worker via `APP_SECRET`.
- Aucune donnée transite par un serveur tiers en dehors d'Enable Banking
  (régulateur européen).

## CLI deploy (optionnel)

Si tu veux pousser via terminal :

```bash
npm i -g wrangler
cd worker
wrangler login
wrangler kv:namespace create "KV"          # colle l'id dans wrangler.toml
wrangler secret put APP_SECRET
wrangler secret put APP_PRIVATE_KEY
wrangler deploy
# puis via la UI : ajoute les variables APP_ID et PWA_URL
```
