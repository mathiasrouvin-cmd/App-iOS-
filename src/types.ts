import type { LucideIcon } from 'lucide-react'
import {
  IconSubscription, IconGrocery, IconRestaurant, IconTransport,
  IconHouse, IconUtility, IconHealth, IconLeisure, IconShopping,
  IconIncome, IconTransfer, IconSavings, IconOther
} from './icons'

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
  | 'savings'
  | 'other'

export interface CategoryMeta {
  id: CategoryId
  label: string
  icon: LucideIcon
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
  { id: 'subscriptions', label: 'Abonnements', icon: IconSubscription, color: '#8b5cf6' },
  { id: 'groceries',     label: 'Courses',     icon: IconGrocery,     color: '#22c55e' },
  { id: 'restaurants',   label: 'Restaurants', icon: IconRestaurant,  color: '#fb923c' },
  { id: 'transport',     label: 'Transport',   icon: IconTransport,   color: '#3b82f6' },
  { id: 'housing',       label: 'Logement',    icon: IconHouse,       color: '#a16207' },
  { id: 'utilities',     label: 'Factures',    icon: IconUtility,     color: '#facc15' },
  { id: 'health',        label: 'Santé',       icon: IconHealth,      color: '#ef4444' },
  { id: 'leisure',       label: 'Loisirs',     icon: IconLeisure,     color: '#f43f5e' },
  { id: 'shopping',      label: 'Shopping',    icon: IconShopping,    color: '#6366f1' },
  { id: 'income',        label: 'Revenus',     icon: IconIncome,      color: '#10b981' },
  { id: 'transfers',     label: 'Virements',   icon: IconTransfer,    color: '#0891b2' },
  { id: 'savings',       label: 'Épargne',     icon: IconSavings,     color: '#059669' },
  { id: 'other',         label: 'Autres',      icon: IconOther,       color: '#64748b' }
]

export const categoryById: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
) as Record<CategoryId, CategoryMeta>
