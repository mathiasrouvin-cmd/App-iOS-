import Foundation

enum TransactionClassifier {
    private static let rules: [(Category, [String])] = [
        (.subscriptions, [
            "netflix", "spotify", "disney", "prime video", "amazon prime", "apple.com/bill",
            "icloud", "youtube", "deezer", "canal+", "molotov", "adobe", "microsoft 365",
            "office 365", "github", "openai", "chatgpt", "dropbox", "notion", "figma",
            "linkedin", "nordvpn", "audible", "twitch"
        ]),
        (.groceries, [
            "carrefour", "leclerc", "auchan", "monoprix", "franprix", "lidl", "aldi",
            "intermarche", "casino", "picard", "bio c bon", "naturalia", "super u",
            "g20", "cora", "match"
        ]),
        (.restaurants, [
            "uber eats", "ubereats", "deliveroo", "just eat", "frichti", "mcdonald",
            "burger king", "kfc", "starbucks", "restaurant", "bistro", "brasserie",
            "pizza", "sushi", "boulangerie", "paul", "pret a manger"
        ]),
        (.transport, [
            "uber", "bolt", "sncf", "ratp", "navigo", "blablacar", "total", "shell",
            "bp ", "esso", "essence", "station", "autoroute", "vinci", "sanef",
            "parking", "velib", "lime", "tier", "dott", "free now", "heetch"
        ]),
        (.housing, [
            "loyer", "foncia", "nexity", "syndic", "copropriete", "immobilier",
            "century 21", "orpi"
        ]),
        (.utilities, [
            "edf", "engie", "total energies", "veolia", "suez", "free", "orange",
            "sfr", "bouygues", "sosh", "red by sfr", "bbox", "livebox", "internet",
            "electricite", "eau", "gaz"
        ]),
        (.health, [
            "pharmacie", "docteur", "dr ", "medecin", "dentiste", "hopital", "clinique",
            "laboratoire", "mutuelle", "harmonie", "mgen", "ameli", "cpam"
        ]),
        (.leisure, [
            "cinema", "ugc", "pathe", "mk2", "gaumont", "theatre", "concert", "fnac",
            "steam", "playstation", "xbox", "nintendo", "decathlon", "salle de sport",
            "basic fit", "fitness park", "musee"
        ]),
        (.shopping, [
            "amazon", "darty", "boulanger", "zara", "h&m", "uniqlo", "zalando",
            "asos", "vinted", "leboncoin", "ikea", "leroy merlin", "castorama", "bricorama",
            "sephora", "nocibe", "apple store"
        ]),
        (.income, [
            "salaire", "virement recu", "remuneration", "paie", "paye", "caf",
            "remboursement", "refund"
        ]),
        (.transfers, [
            "virement", "vir sepa", "lydia", "paypal", "revolut", "wise",
            "transfert", "prelevement sepa"
        ])
    ]

    static func classify(label: String, amount: Decimal) -> Category {
        let normalized = label.lowercased()
            .folding(options: .diacriticInsensitive, locale: .current)

        for (category, keywords) in rules {
            for keyword in keywords where normalized.contains(keyword) {
                return category
            }
        }

        if amount > 0 { return .income }
        return .other
    }
}
