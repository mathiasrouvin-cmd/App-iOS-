import SwiftUI

@main
struct BankingAppApp: App {
    @StateObject private var store = TransactionStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
