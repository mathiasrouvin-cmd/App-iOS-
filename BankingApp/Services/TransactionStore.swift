import Foundation
import SwiftUI

@MainActor
final class TransactionStore: ObservableObject {
    @Published private(set) var transactions: [Transaction] = []
    @Published var lastImportError: String?

    init(preloadSample: Bool = true) {
        if preloadSample { loadSample() }
    }

    func importCSV(from url: URL) {
        do {
            let imported = try CSVImporter.importTransactions(from: url)
            merge(imported)
            lastImportError = nil
        } catch {
            lastImportError = error.localizedDescription
        }
    }

    func importCSV(content: String) {
        do {
            let imported = try CSVImporter.parse(content)
            merge(imported)
            lastImportError = nil
        } catch {
            lastImportError = error.localizedDescription
        }
    }

    func updateCategory(for transaction: Transaction, to category: Category) {
        guard let index = transactions.firstIndex(where: { $0.id == transaction.id }) else { return }
        transactions[index].category = category
    }

    func reset() { transactions = [] }

    private func merge(_ new: [Transaction]) {
        let existingKeys = Set(transactions.map(key(for:)))
        let additions = new.filter { !existingKeys.contains(key(for: $0)) }
        transactions = (transactions + additions).sorted { $0.date > $1.date }
    }

    private func key(for tx: Transaction) -> String {
        "\(tx.date.timeIntervalSince1970)-\(tx.label)-\(tx.amount)"
    }

    // MARK: Aggregations

    func total(for category: Category) -> Decimal {
        transactions.filter { $0.category == category }.reduce(0) { $0 + $1.amount }
    }

    func transactions(in category: Category) -> [Transaction] {
        transactions.filter { $0.category == category }
    }

    var categoriesWithActivity: [Category] {
        let used = Set(transactions.map(\.category))
        return Category.allCases.filter { used.contains($0) }
    }

    var totalBalance: Decimal {
        transactions.reduce(0) { $0 + $1.amount }
    }

    var totalIncome: Decimal {
        transactions.filter { $0.amount > 0 }.reduce(0) { $0 + $1.amount }
    }

    var totalExpenses: Decimal {
        transactions.filter { $0.amount < 0 }.reduce(0) { $0 + $1.amount }
    }

    // MARK: Sample

    private func loadSample() {
        guard let url = Bundle.main.url(forResource: "sample", withExtension: "csv"),
              let content = try? String(contentsOf: url, encoding: .utf8) else {
            importCSV(content: Self.embeddedSample)
            return
        }
        importCSV(content: content)
    }

    private static let embeddedSample = """
    date;libelle;montant
    2026-04-15;SALAIRE ACME SA;2450.00
    2026-04-14;NETFLIX.COM;-15.99
    2026-04-14;CARREFOUR PARIS 11;-58.42
    2026-04-13;UBER EATS;-24.90
    2026-04-12;SPOTIFY;-9.99
    2026-04-11;SNCF CONNECT;-72.00
    2026-04-10;LOYER FONCIA;-890.00
    2026-04-10;EDF PRELEVEMENT;-64.20
    2026-04-09;AMAZON EU;-39.90
    2026-04-08;PHARMACIE DE LA GARE;-12.30
    2026-04-07;DELIVEROO;-18.50
    2026-04-06;APPLE.COM/BILL ICLOUD;-2.99
    2026-04-05;MONOPRIX;-34.10
    2026-04-04;UGC CINE CITE;-11.90
    2026-04-03;RATP NAVIGO;-84.10
    2026-04-02;ADOBE CREATIVE CLOUD;-23.99
    2026-04-01;VIREMENT RECU MARIE;120.00
    2026-03-30;TOTAL ENERGIES STATION;-56.80
    2026-03-29;FNAC PARIS;-29.99
    2026-03-28;GITHUB INC;-4.00
    """
}
