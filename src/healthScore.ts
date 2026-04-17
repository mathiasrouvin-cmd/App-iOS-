import type { CategoryId, Transaction } from './types'
import { detectSubscriptions } from './subscriptions'
import { monthKey } from './utils/date'

export interface ScoreBreakdown {
  total: number
  savingsRate: { score: number; max: number; value: number }
  subscriptionLoad: { score: number; max: number; value: number }
  regularity: { score: number; max: number; value: number }
  budgetDiscipline: { score: number; max: number; value: number }
  diversity: { score: number; max: number; value: number }
  label: 'Excellent' | 'Bon' | 'Moyen' | 'À améliorer' | 'Insuffisant'
  color: string
  months: number
}

interface MonthAgg { income: number; expenses: number; categories: Set<CategoryId> }

function monthlyAggregates(transactions: Transaction[]): Map<string, MonthAgg> {
  const map = new Map<string, MonthAgg>()
  for (const t of transactions) {
    const k = monthKey(t.date)
    const cur = map.get(k) ?? { income: 0, expenses: 0, categories: new Set<CategoryId>() }
    if (t.amount > 0) cur.income += t.amount
    else cur.expenses += Math.abs(t.amount)
    cur.categories.add(t.category)
    map.set(k, cur)
  }
  return map
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function linear(value: number, zero: number, full: number, maxPts: number): number {
  if (zero === full) return 0
  const t = (value - zero) / (full - zero)
  return clamp(t, 0, 1) * maxPts
}

export function computeHealthScore(
  transactions: Transaction[],
  budgets: Partial<Record<CategoryId, number>>
): ScoreBreakdown | null {
  const monthly = monthlyAggregates(transactions)
  if (monthly.size === 0) return null

  const months = Array.from(monthly.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6)
    .map(([, v]) => v)

  const totalIncome = months.reduce((s, m) => s + m.income, 0)
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0)

  // 1. Savings rate: (income - expenses) / income — cible 20% = full points
  const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : -1
  const savingsScore = linear(savingsRatio, 0, 0.2, 30)

  // 2. Subscription load: coût mensuel des abos / revenu mensuel moyen — cible ≤ 5 % = full
  const subs = detectSubscriptions(transactions)
  const monthlySubCost = subs.reduce((s, x) => s + x.monthlyCost, 0)
  const monthlyIncome = totalIncome / months.length
  const subRatio = monthlyIncome > 0 ? monthlySubCost / monthlyIncome : 1
  // Inverse scale: 5% → full, 20% → 0
  const subScore = linear(-subRatio, -0.2, -0.05, 20)

  // 3. Regularity: coefficient de variation des dépenses mensuelles (plus bas = mieux)
  let regularityScore = 0
  if (months.length >= 2) {
    const mean = totalExpenses / months.length
    if (mean > 0) {
      const variance = months.reduce((s, m) => s + (m.expenses - mean) ** 2, 0) / months.length
      const stddev = Math.sqrt(variance)
      const cv = stddev / mean
      // 0.15 → full, 0.45 → 0
      regularityScore = linear(-cv, -0.45, -0.15, 20)
    }
  } else {
    regularityScore = 10
  }

  // 4. Budget discipline: proportion de catégories avec budget respecté sur le dernier mois
  let budgetScore = 10  // neutre si pas de budgets
  const budgetEntries = Object.entries(budgets).filter(([, v]) => v && v > 0)
  if (budgetEntries.length > 0 && months.length > 0) {
    const lastMonthKey = Array.from(monthly.keys()).sort().slice(-1)[0]
    const lastMonthTxs = transactions.filter(t => monthKey(t.date) === lastMonthKey)
    let respected = 0
    for (const [cat, budget] of budgetEntries) {
      const spent = lastMonthTxs
        .filter(t => t.category === cat && t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0)
      if (spent <= (budget as number)) respected++
    }
    budgetScore = (respected / budgetEntries.length) * 20
  }

  // 5. Diversity: nombre de catégories distinctes sur la période — cible 6+
  const allCats = new Set<CategoryId>()
  for (const m of months) m.categories.forEach(c => allCats.add(c))
  const diversityScore = linear(allCats.size, 2, 6, 10)

  const total = Math.round(
    savingsScore + subScore + regularityScore + budgetScore + diversityScore
  )

  let label: ScoreBreakdown['label']
  let color: string
  if (total >= 80) { label = 'Excellent'; color = '#10b981' }
  else if (total >= 65) { label = 'Bon'; color = '#14b8a6' }
  else if (total >= 50) { label = 'Moyen'; color = '#f59e0b' }
  else if (total >= 30) { label = 'À améliorer'; color = '#f97316' }
  else { label = 'Insuffisant'; color = '#ef4444' }

  return {
    total: clamp(total, 0, 100),
    savingsRate: { score: Math.round(savingsScore), max: 30, value: savingsRatio },
    subscriptionLoad: { score: Math.round(subScore), max: 20, value: subRatio },
    regularity: { score: Math.round(regularityScore), max: 20, value: 0 },
    budgetDiscipline: { score: Math.round(budgetScore), max: 20, value: 0 },
    diversity: { score: Math.round(diversityScore), max: 10, value: allCats.size },
    label,
    color,
    months: months.length
  }
}
