# Mon compte — PWA de gestion de compte

App web installable (PWA) pour visualiser un compte bancaire à partir d'un import CSV,
avec classification automatique (Abonnements, Courses, Transport…), écran détaillé par
catégorie et par transaction. **Aucune installation d'Xcode nécessaire.**

## Utilisation sur iPhone

1. Ouvre l'URL déployée dans **Safari** (pas Chrome — l'ajout à l'écran d'accueil est une feature Safari).
2. Tape sur le bouton **Partager** → **Sur l'écran d'accueil**.
3. L'app apparaît comme une vraie app iOS, en plein écran, sans barre Safari.
4. Les données sont stockées en `localStorage` sur ton téléphone — rien ne part en ligne.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` publie l'app sur GitHub Pages à chaque push
sur `main` ou `claude/ios-banking-app-oWF0W`.

Pour l'activer :
1. Va dans **Settings → Pages** du repo.
2. Source : **GitHub Actions**.
3. Attends que le workflow passe au vert — l'URL sera `https://<user>.github.io/App-iOS-/`.

## Dev local

```bash
npm install
npm run dev        # http://localhost:5173/App-iOS-/
npm run build      # génère dist/
npm run preview    # serve le build de prod
```

## Fonctionnalités

- **Import CSV** : séparateur `;`, `,` ou tab détecté automatiquement. Colonnes attendues :
  `date`, `libellé` (ou `label` / `description` / `intitulé` / `motif`), `montant`
  (ou `amount`, ou `débit`/`crédit` séparés). Montants en `1234,56` ou `1234.56` ou `1 234,56 €`.
- **Classification auto** : règles par mots-clés FR (Netflix/Spotify → Abonnements,
  Carrefour/Monoprix → Courses, SNCF/Uber → Transport, EDF/Free → Factures, etc.).
- **Accueil** : solde, revenus, dépenses ; liste des catégories avec totaux, cliquables.
- **Détail catégorie** : total, nombre de transactions, liste chronologique.
- **Détail transaction** : date, libellé, montant, re-catégorisation manuelle, suppression.
- **Offline** : service worker via `vite-plugin-pwa`, tout fonctionne sans réseau.
- **Dark mode** : automatique selon les réglages système.

## Format CSV attendu

```
date;libelle;montant
2026-04-15;SALAIRE ACME SA;2450.00
2026-04-14;NETFLIX.COM;-15.99
2026-04-14;CARREFOUR PARIS 11;-58.42
```

Montants négatifs = dépenses. Un jeu de données d'exemple est chargé automatiquement
la première fois (voir `public/sample.csv`).

## Structure

```
src/
  main.tsx            # entrée React + enregistrement du service worker
  App.tsx             # routes (HashRouter)
  store.tsx           # Context + localStorage
  csv.ts              # parsing CSV
  classifier.ts       # règles de classification
  types.ts            # types + catégories (label/icône/couleur)
  format.ts           # formats € et dates
  pages/
    Home.tsx
    CategoryDetail.tsx
    TransactionDetail.tsx
  components/
    SummaryCard.tsx
    CategoryRow.tsx
    TransactionRow.tsx
    ImportButton.tsx
  index.css
public/
  icon.svg
  apple-touch-icon.png
  sample.csv
```
