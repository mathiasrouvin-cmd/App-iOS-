import SwiftUI

struct CategoryRow: View {
    let category: Category
    let total: Decimal
    let count: Int

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: category.systemImage)
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(category.color.gradient, in: RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 2) {
                Text(category.rawValue).font(.body).fontWeight(.medium)
                Text("\(count) transaction\(count > 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(total.currencyString)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(total < 0 ? .red : .green)
        }
        .padding(.vertical, 4)
    }
}
