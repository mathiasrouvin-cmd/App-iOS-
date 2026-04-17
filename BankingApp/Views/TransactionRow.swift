import SwiftUI

struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: transaction.category.systemImage)
                .font(.footnote)
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(transaction.category.color.gradient, in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.label)
                    .font(.subheadline)
                    .lineLimit(1)
                Text(transaction.date, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(transaction.amount.currencyString)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(transaction.isExpense ? .red : .green)
        }
        .padding(.vertical, 2)
    }
}
