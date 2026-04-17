import SwiftUI

struct TransactionDetailView: View {
    let transaction: Transaction
    @EnvironmentObject private var store: TransactionStore

    private var current: Transaction {
        store.transactions.first { $0.id == transaction.id } ?? transaction
    }

    var body: some View {
        Form {
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 6) {
                        Image(systemName: current.category.systemImage)
                            .font(.system(size: 40))
                            .foregroundStyle(.white)
                            .frame(width: 80, height: 80)
                            .background(current.category.color.gradient, in: Circle())
                        Text(current.amount.currencyString)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(current.isExpense ? .red : .green)
                    }
                    Spacer()
                }
                .padding(.vertical, 12)
                .listRowBackground(Color.clear)
            }

            Section("Informations") {
                LabeledContent("Libellé", value: current.label)
                LabeledContent("Date", value: current.date.formatted(date: .long, time: .omitted))
                LabeledContent("Montant", value: current.amount.currencyString)
            }

            Section("Catégorie") {
                Picker("Catégorie", selection: Binding(
                    get: { current.category },
                    set: { store.updateCategory(for: current, to: $0) }
                )) {
                    ForEach(Category.allCases) { cat in
                        Label(cat.rawValue, systemImage: cat.systemImage).tag(cat)
                    }
                }
                .pickerStyle(.navigationLink)
            }
        }
        .navigationTitle("Détail")
        .navigationBarTitleDisplayMode(.inline)
    }
}
