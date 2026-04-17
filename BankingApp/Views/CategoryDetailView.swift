import SwiftUI

struct CategoryDetailView: View {
    let category: Category
    @EnvironmentObject private var store: TransactionStore

    private var items: [Transaction] {
        store.transactions(in: category).sorted { $0.date > $1.date }
    }

    private var total: Decimal { store.total(for: category) }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: category.systemImage)
                            .font(.title)
                            .foregroundStyle(.white)
                            .frame(width: 56, height: 56)
                            .background(category.color.gradient, in: RoundedRectangle(cornerRadius: 14))
                        VStack(alignment: .leading) {
                            Text(category.rawValue).font(.headline)
                            Text("\(items.count) transactions")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    Text(total.currencyString)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(total < 0 ? .red : .green)
                }
                .padding(.vertical, 8)
            }

            Section("Transactions") {
                ForEach(items) { tx in
                    NavigationLink {
                        TransactionDetailView(transaction: tx)
                    } label: {
                        TransactionRow(transaction: tx)
                    }
                }
            }
        }
        .navigationTitle(category.rawValue)
        .navigationBarTitleDisplayMode(.inline)
    }
}
