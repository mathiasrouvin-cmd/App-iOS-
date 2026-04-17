import type { Transaction } from '../types'

export type Period = 'all' | string // 'YYYY-MM'

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function monthLabel(key: string, style: 'long' | 'short' = 'long'): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('fr-FR', {
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric'
  })
}

export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function availableMonths(transactions: Transaction[]): string[] {
  const set = new Set(transactions.map(t => monthKey(t.date)))
  return Array.from(set).sort().reverse()
}

export function inPeriod(tx: Transaction, period: Period): boolean {
  return period === 'all' ? true : monthKey(tx.date) === period
}

export function periodLabel(period: Period): string {
  return period === 'all' ? 'Tout' : monthLabel(period)
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.abs((db - da) / 86_400_000)
}
