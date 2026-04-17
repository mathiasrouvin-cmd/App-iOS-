# BankingApp — Gestion de compte iOS

App iOS native (SwiftUI, iOS 17+) pour visualiser un compte bancaire à partir d'un import CSV,
avec classification automatique des transactions (Abonnements, Courses, Transport, Logement, etc.)
et écran détaillé par catégorie.

## Fonctionnalités

- **Import CSV** : formats `;` ou `,`, détection automatique du séparateur et de l'encodage UTF-8 / ISO-8859-1.
  Colonnes attendues : `date`, `libellé` (ou `label` / `description`), `montant` (ou `amount`).
- **Classification automatique** : règles basées sur des mots-clés FR (Netflix, Spotify → Abonnements ;
  Carrefour, Monoprix → Courses ; SNCF, Uber → Transport ; etc.).
- **Écran principal** : solde + total revenus / dépenses, liste des catégories présentes.
- **Détail par catégorie** : total, nombre de transactions, liste détaillée.
- **Détail par transaction** : modification manuelle de la catégorie.
- **Jeu de données d'exemple** chargé au premier lancement (`BankingApp/Resources/sample.csv`).

## Structure

```
BankingApp/
  BankingAppApp.swift        # Entrée @main SwiftUI
  Models/
    Transaction.swift
    Category.swift
  Services/
    CSVImporter.swift        # Parsing CSV robuste
    TransactionClassifier.swift
    TransactionStore.swift   # ObservableObject, agrégations
  Views/
    ContentView.swift
    SummaryCard.swift
    CategoryRow.swift
    CategoryDetailView.swift
    TransactionRow.swift
    TransactionDetailView.swift
  Resources/sample.csv
  Assets.xcassets
```

## Comment faire tourner l'app sans Xcode local

Construire une app iOS requiert macOS + Xcode (Apple impose cette contrainte).
Si tu n'as pas Xcode, voici les options :

1. **GitHub Actions (inclus dans ce repo)** — `.github/workflows/ios-build.yml` compile l'app
   sur un runner `macos-14` à chaque push. Tu auras la preuve que le code compile sans installer Xcode.
2. **Mac emprunté / cloud Mac** — services comme MacStadium, MacinCloud, ou un Mac de collègue.
   Clone le repo, ouvre `BankingApp.xcodeproj`, ⌘R pour lancer le simulateur iOS.
3. **Swift Playgrounds sur iPad** — peut ouvrir des apps SwiftUI simples ; possible mais nécessite
   quelques ajustements manuels d'import.
4. **Xcode Cloud** — si tu as un compte Apple Developer, tu peux builder et tester dans le cloud.

## Format CSV attendu

```
date;libelle;montant
2026-04-15;SALAIRE ACME SA;2450.00
2026-04-14;NETFLIX.COM;-15.99
2026-04-14;CARREFOUR PARIS 11;-58.42
```

Montants négatifs = dépenses. Le séparateur décimal `,` est aussi accepté (`-15,99`).
