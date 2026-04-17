import type { Transaction } from './types'
import { categoryById } from './types'
import { detectSubscriptions } from './subscriptions'
import { monthKey, monthLabel } from './utils/date'
import { fmtEuro } from './format'

export interface MonthlySummary {
  month: string
  monthName: string
  expenses: number
  income: number
  transactionCount: number
  deltaVsPrevious: number | null  // % change vs previous month, can be null
  topCategory: { label: string; icon: unknown; color: string; share: number } | null
  subscriptionCost: number
  biggestExpense: Transaction | null
  text: string
}

export function buildMonthlySummary(
  transactions: Transaction[],
  targetMonth: string
): MonthlySummary | null {
  const txs = transactions.filter(t => monthKey(t.date) === targetMonth)
  if (txs.length === 0) return null

  const expenses = Math.abs(txs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const transactionCount = txs.length

  // Previous month delta
  const [yStr, mStr] = targetMonth.split('-')
  const y = Number(yStr), m = Number(mStr)
  const prevDate = new Date(y, m - 2, 1)
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const prevTxs = transactions.filter(t => monthKey(t.date) === prevKey)
  const prevExpenses = Math.abs(prevTxs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const deltaVsPrevious = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null

  // Top category
  const perCat = new Map<string, number>()
  for (const t of txs) {
    if (t.amount >= 0) continue
    perCat.set(t.category, (perCat.get(t.category) ?? 0) + Math.abs(t.amount))
  }
  let topEntry: [string, number] | null = null
  for (const e of perCat.entries()) {
    if (!topEntry || e[1] > topEntry[1]) topEntry = e
  }
  const topCategory = topEntry
    ? {
        label: categoryById[topEntry[0] as keyof typeof categoryById].label,
        icon: categoryById[topEntry[0] as keyof typeof categoryById].icon,
        color: categoryById[topEntry[0] as keyof typeof categoryById].color,
        share: expenses > 0 ? (topEntry[1] / expenses) * 100 : 0
      }
    : null

  // Subscriptions
  const subs = detectSubscriptions(transactions)
  const subscriptionCost = subs.reduce((s, x) => s + x.monthlyCost, 0)

  // Biggest expense
  const biggestExpense = txs
    .filter(t => t.amount < 0)
    .sort((a, b) => a.amount - b.amount)[0] ?? null

  const monthName = monthLabel(targetMonth)
  const text = buildText({
    monthName,
    expenses,
    transactionCount,
    deltaVsPrevious,
    topCategory,
    subscriptionCost,
    biggestExpense
  })

  return {
    month: targetMonth,
    monthName,
    expenses,
    income,
    transactionCount,
    deltaVsPrevious,
    topCategory,
    subscriptionCost,
    biggestExpense,
    text
  }
}

function buildText(data: {
  monthName: string
  expenses: number
  transactionCount: number
  deltaVsPrevious: number | null
  topCategory: { label: string; share: number } | null
  subscriptionCost: number
  biggestExpense: Transaction | null
}): string {
  const pieces: string[] = []

  const monthCap = data.monthName.charAt(0).toUpperCase() + data.monthName.slice(1)
  const delta = data.deltaVsPrevious
  const deltaStr = delta == null
    ? ''
    : delta > 0
      ? ` (+${Math.round(delta)} % vs mois précédent)`
      : ` (${Math.round(delta)} % vs mois précédent)`

  pieces.push(
    `**${monthCap}** : ${fmtEuro(-data.expenses)} dépensés${deltaStr} sur ${data.transactionCount} transactions.`
  )

  if (data.topCategory) {
    pieces.push(
      `Top catégorie : **${data.topCategory.label}** (${Math.round(data.topCategory.share)} %).`
    )
  }

  if (data.subscriptionCost > 0) {
    pieces.push(`Tes abos récurrents pèsent ${fmtEuro(-data.subscriptionCost)}/mois.`)
  }

  if (data.biggestExpense) {
    pieces.push(
      `Plus grosse dépense : ${data.biggestExpense.label} (${fmtEuro(data.biggestExpense.amount)}).`
    )
  }

  return pieces.join(' ')
}
