import SwiftUI

enum Category: String, CaseIterable, Codable, Identifiable {
    case subscriptions = "Abonnements"
    case groceries = "Courses"
    case restaurants = "Restaurants"
    case transport = "Transport"
    case housing = "Logement"
    case utilities = "Factures"
    case health = "Santé"
    case leisure = "Loisirs"
    case shopping = "Shopping"
    case income = "Revenus"
    case transfers = "Virements"
    case other = "Autres"

    var id: String { rawValue }

    var systemImage: String {
        switch self {
        case .subscriptions: return "repeat.circle.fill"
        case .groceries: return "cart.fill"
        case .restaurants: return "fork.knife"
        case .transport: return "car.fill"
        case .housing: return "house.fill"
        case .utilities: return "bolt.fill"
        case .health: return "cross.case.fill"
        case .leisure: return "gamecontroller.fill"
        case .shopping: return "bag.fill"
        case .income: return "arrow.down.circle.fill"
        case .transfers: return "arrow.left.arrow.right.circle.fill"
        case .other: return "questionmark.circle.fill"
        }
    }

    var color: Color {
        switch self {
        case .subscriptions: return .purple
        case .groceries: return .green
        case .restaurants: return .orange
        case .transport: return .blue
        case .housing: return .brown
        case .utilities: return .yellow
        case .health: return .red
        case .leisure: return .pink
        case .shopping: return .indigo
        case .income: return .mint
        case .transfers: return .teal
        case .other: return .gray
        }
    }
}
