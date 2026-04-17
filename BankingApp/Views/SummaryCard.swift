import SwiftUI

struct SummaryCard: View {
    let balance: Decimal
    let income: Decimal
    let expenses: Decimal

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Solde")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(balance.currencyString)
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(balance >= 0 ? Color.primary : .red)

            HStack(spacing: 16) {
                flow(title: "Revenus", value: income, color: .green, icon: "arrow.down")
                flow(title: "Dépenses", value: expenses, color: .red, icon: "arrow.up")
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color.accentColor.opacity(0.15), Color.accentColor.opacity(0.05)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private func flow(title: String, value: Decimal, color: Color, icon: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .padding(8)
                .background(color.opacity(0.15), in: Circle())
            VStack(alignment: .leading) {
                Text(title).font(.caption).foregroundStyle(.secondary)
                Text(value.currencyString).font(.subheadline).bold()
            }
        }
    }
}

extension Decimal {
    var currencyString: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "EUR"
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: self as NSDecimalNumber) ?? "\(self)"
    }
}
