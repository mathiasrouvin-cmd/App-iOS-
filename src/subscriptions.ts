import { normalize } from './classifier'
import type { Transaction } from './types'
import { daysBetween } from './utils/date'

export interface Subscription {
  key: string
  merchant: string
  samples: Transaction[]
  medianAmount: number
  cadence: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular'
  monthlyCost: number
  lastSeen: string
}

// Remove bank noise (ACHAT CB, VIREMENT, PRELEVEMENT, dates, amounts) to extract
// something close to the merchant.
function extractMerchant(label: string): string {
  let s = normalize(label)
  s = s
    .replace(/\b(achat|acht|cb|carte|vir|virement|prelevement|plvt|sepa|prlv|paiement)\b/g, ' ')
    .replace(/\b\d{2,}\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return s.split(' ').slice(0, 3).join(' ') || s
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

function cadenceFromIntervals(intervals: number[]): Subscription['cadence'] {
  if (intervals.length === 0) return 'irregular'
  const m = median(intervals)
  if (m >= 5 && m <= 9) return 'weekly'
  if (m >= 24 && m <= 35) return 'monthly'
  if (m >= 80 && m <= 100) return 'quarterly'
  if (m >= 340 && m <= 390) return 'yearly'
  return 'irregular'
}

function monthlyFromCadence(amount: number, cadence: Subscription['cadence']): number {
  switch (cadence) {
    case 'weekly': return amount * 52 / 12
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'yearly': return amount / 12
    default: return amount
  }
}

export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  // Transfers (to own savings, between own accounts, to friends) are not
  // subscriptions — exclude them even if recurring monthly.
  const expenses = transactions.filter(
    t => t.amount < 0 && t.category !== 'transfers'
  )
  const groups = new Map<string, Transaction[]>()
  for (const t of expenses) {
    const key = extractMerchant(t.label)
    if (key.length < 3) continue
    const arr = groups.get(key) ?? []
    arr.push(t)
    groups.set(key, arr)
  }

  const subs: Subscription[] = []
  for (const [key, items] of groups) {
    if (items.length < 2) continue

    const amounts = items.map(t => Math.abs(t.amount))
    const med = median(amounts)
    // Amounts must be within ±25% of median to count as the same subscription
    const stable = items.filter(t => {
      const a = Math.abs(t.amount)
      return a >= med * 0.75 && a <= med * 1.25
    })
    if (stable.length < 2) continue

    const sorted = [...stable].sort((a, b) => (a.date < b.date ? -1 : 1))
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i - 1].date, sorted[i].date))
    }
    const cadence = cadenceFromIntervals(intervals)
    if (cadence === 'irregular' && stable.length < 3) continue

    const monthlyCost = monthlyFromCadence(med, cadence)
    subs.push({
      key,
      merchant: items[0].label,
      samples: sorted,
      medianAmount: med,
      cadence,
      monthlyCost,
      lastSeen: sorted[sorted.length - 1].date
    })
  }

  return subs.sort((a, b) => b.monthlyCost - a.monthlyCost)
}

export function cadenceLabel(c: Subscription['cadence']): string {
  switch (c) {
    case 'weekly': return 'Hebdo'
    case 'monthly': return 'Mensuel'
    case 'quarterly': return 'Trimestriel'
    case 'yearly': return 'Annuel'
    default: return 'Récurrent'
  }
}
