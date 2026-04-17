export type CategoryId =
  | 'subscriptions'
  | 'groceries'
  | 'restaurants'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'health'
  | 'leisure'
  | 'shopping'
  | 'income'
  | 'transfers'
  | 'other'

export interface CategoryMeta {
  id: CategoryId
  label: string
  icon: string
  color: string
}

export interface Transaction {
  id: string
  date: string
  label: string
  amount: number
  category: CategoryId
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'subscriptions', label: 'Abonnements', icon: '🔁', color: '#8b5cf6' },
  { id: 'groceries', label: 'Courses', icon: '🛒', color: '#16a34a' },
  { id: 'restaurants', label: 'Restaurants', icon: '🍴', color: '#f97316' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#2563eb' },
  { id: 'housing', label: 'Logement', icon: '🏠', color: '#92400e' },
  { id: 'utilities', label: 'Factures', icon: '⚡', color: '#eab308' },
  { id: 'health', label: 'Santé', icon: '➕', color: '#dc2626' },
  { id: 'leisure', label: 'Loisirs', icon: '🎮', color: '#ec4899' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#6366f1' },
  { id: 'income', label: 'Revenus', icon: '💰', color: '#10b981' },
  { id: 'transfers', label: 'Virements', icon: '↔️', color: '#0d9488' },
  { id: 'other', label: 'Autres', icon: '❔', color: '#6b7280' }
]

export const categoryById: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
) as Record<CategoryId, CategoryMeta>
