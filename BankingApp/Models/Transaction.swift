import Foundation

struct Transaction: Identifiable, Hashable, Codable {
    let id: UUID
    let date: Date
    let label: String
    let amount: Decimal
    var category: Category

    init(id: UUID = UUID(), date: Date, label: String, amount: Decimal, category: Category) {
        self.id = id
        self.date = date
        self.label = label
        self.amount = amount
        self.category = category
    }

    var isExpense: Bool { amount < 0 }
    var absoluteAmount: Decimal { amount < 0 ? -amount : amount }
}
