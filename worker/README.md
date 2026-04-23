# Banking sync — Cloudflare Worker + GoCardless

Tiny worker that lets the PWA pull transactions from your bank via the
GoCardless Bank Account Data API (ex-Nordigen, free PSD2 aggregator).

```
[iPhone PWA] ──HTTPS──▶ [Cloudflare Worker] ──PSD2──▶ [GoCardless] ──▶ [ta banque]
```

Setup : ~30 min, tout gratuit, fonctionne depuis l'iPhone.

## 1. Compte GoCardless Bank Account Data

1. Va sur https://bankaccountdata.gocardless.com/ → **Sign up**.
2. Renseigne nom + email. Pour « Purpose », mets **Personal finance
   management**.
3. Valide l'email.
4. Menu **User secrets** → **Create new** → copie **SECRET_ID** et
   **SECRET_KEY** dans un endroit sûr (tu ne les reverras plus).

## 2. Compte Cloudflare

1. https://dash.cloudflare.com/sign-up → inscris-toi (free, sans CB).
2. Valide l'email.

## 3. Crée le KV namespace

1. Dans le dashboard Cloudflare → **Workers & Pages** → **KV**.
2. **Create a namespace** → nom : `banking-sync`. Valide.
3. Note l'ID affiché (pas critique, mais pratique).

## 4. Crée le Worker

1. Dashboard → **Workers & Pages** → **Create application** →
   **Create Worker**.
2. Nom : `banking-sync` (ou ce que tu veux). **Deploy** avec le code par
   défaut (on va le remplacer).
3. Sur la page du worker, onglet **Edit code** (ou « Quick edit »).
4. Supprime tout, colle le contenu de `worker.js` de ce dossier.
5. **Save and deploy**.

## 5. Bind le KV

1. Worker → **Settings** → **Variables and Secrets** → section
   **KV Namespace Bindings** → **Add binding**.
2. Variable name : `KV`, KV namespace : celui créé à l'étape 3.
3. **Save**.

## 6. Ajoute les secrets

Worker → **Settings** → **Variables and Secrets** → **Add** (type *Secret*) :

| Nom | Valeur |
| --- | --- |
| `GOCARDLESS_SECRET_ID` | celui récupéré étape 1 |
| `GOCARDLESS_SECRET_KEY` | celui récupéré étape 1 |
| `APP_SECRET` | une chaîne aléatoire longue (50+ caractères), génère-la via https://www.random.org/strings ou similaire. **Copie-la aussi** côté PWA dans les réglages. |

Puis une **Variable** (type *Plain text*) :

| Nom | Valeur |
| --- | --- |
| `PWA_URL` | URL publique de ta PWA, ex. `https://mathiasrouvin-cmd.github.io/App-iOS-/` |

**Save and deploy**.

## 7. Récupère l'URL du worker

En haut de la page du worker, tu vois quelque chose comme :
`https://banking-sync.<ton-compte>.workers.dev`

Copie cette URL.

## 8. Configure la PWA

Dans la PWA, onglet **Réglages** → section **Synchronisation banque** :

- **URL du backend** : colle l'URL du worker (sans `/` final).
- **Jeton d'auth** : colle `APP_SECRET` (même valeur qu'étape 6).
- **Tester la connexion** → doit afficher « OK ».
- **Lier une banque** → choisis ta banque → tu es redirigé sur le
  parcours GoCardless → consentement → bank login → retour dans l'app.
- **Synchroniser** → l'app fetch les 90 derniers jours.

---

## CLI deploy (optionnel)

Si tu veux pousser via terminal :

```bash
npm i -g wrangler
cd worker
wrangler login
wrangler kv:namespace create "KV"
# colle l'id retourné dans wrangler.toml
wrangler secret put GOCARDLESS_SECRET_ID
wrangler secret put GOCARDLESS_SECRET_KEY
wrangler secret put APP_SECRET
wrangler deploy
```

## Quotas & limites

- GoCardless : 10 requêtes/jour/compte sur les transactions (large marge
  pour un usage perso, une seule sync/jour suffit).
- Re-consentement à donner à la banque tous les **90 jours** (imposé par
  PSD2). L'app te préviendra.
- Cloudflare Workers free : 100 000 requêtes/jour, 10 ms CPU/req. Aucune
  chance de saturer.

## Sécurité

- Les tokens GoCardless sont stockés dans Cloudflare KV, chiffrés au
  repos, jamais exposés à la PWA.
- La PWA s'authentifie avec `APP_SECRET` en header `Authorization`.
  Garde ce secret privé (équivalent à un mot de passe).
- Aucune donnée ne transite par un serveur tiers à part GoCardless
  (qui est supervisé par la BCE).
