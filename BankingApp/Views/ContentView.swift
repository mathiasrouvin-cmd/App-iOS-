import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @EnvironmentObject private var store: TransactionStore
    @State private var showingImporter = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    SummaryCard(
                        balance: store.totalBalance,
                        income: store.totalIncome,
                        expenses: store.totalExpenses
                    )
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }

                Section("Catégories") {
                    ForEach(store.categoriesWithActivity) { category in
                        NavigationLink(value: category) {
                            CategoryRow(
                                category: category,
                                total: store.total(for: category),
                                count: store.transactions(in: category).count
                            )
                        }
                    }
                }

                if store.transactions.isEmpty {
                    Section {
                        ContentUnavailableView(
                            "Aucune transaction",
                            systemImage: "tray",
                            description: Text("Importez un fichier CSV pour commencer.")
                        )
                    }
                }
            }
            .navigationTitle("Mon compte")
            .navigationDestination(for: Category.self) { category in
                CategoryDetailView(category: category)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingImporter = true
                    } label: {
                        Label("Importer", systemImage: "square.and.arrow.down")
                    }
                }
            }
            .fileImporter(
                isPresented: $showingImporter,
                allowedContentTypes: [.commaSeparatedText, .plainText, .text],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    if let url = urls.first { store.importCSV(from: url) }
                case .failure(let error):
                    store.lastImportError = error.localizedDescription
                }
            }
            .alert(
                "Import impossible",
                isPresented: Binding(
                    get: { store.lastImportError != nil },
                    set: { if !$0 { store.lastImportError = nil } }
                ),
                presenting: store.lastImportError
            ) { _ in
                Button("OK", role: .cancel) { store.lastImportError = nil }
            } message: { message in
                Text(message)
            }
        }
    }
}

#Preview {
    ContentView().environmentObject(TransactionStore())
}
