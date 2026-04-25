import type { Transaction } from './types'
import { categoryById } from './types'
import { detectSubscriptions } from './subscriptions'
import { monthKey, monthLabel } from './utils/date'
import { fmtEuro } from './format'

export interface MonthlySummary {
  month: string
  monthName: string
  variableExpenses: number
  income: number
  transactionCount: number
  deltaVsPrevious: number | null
  topCategory: { label: string; icon: unknown; color: string; share: number } | null
  recurringCost: number
  biggestExpense: Transaction | null
  fixedCount: number
  text: string
}

// Build the set of transaction IDs considered "fixed" (rent, loans,
// insurance, streaming subs…). Anything the subscription detector tagged
// as at least a monthly cadence counts.
function fixedTransactionIds(transactions: Transaction[]): Set<string> {
  const subs = detectSubscriptions(transactions)
  const ids = new Set<string>()
  for (const s of subs) {
    if (s.cadence === 'monthly' || s.cadence === 'quarterly' || s.cadence === 'yearly') {
      for (const t of s.samples) ids.add(t.id)
    }
  }
  return ids
}

function monthlyRecurringCost(transactions: Transaction[]): number {
  const subs = detectSubscriptions(transactions)
  return subs.reduce((s, x) => s + x.monthlyCost, 0)
}

function variableExpensesFor(
  transactions: Transaction[],
  month: string,
  fixedIds: Set<string>
): { sum: number; txs: Transaction[] } {
  const txs = transactions.filter(
    t =>
      monthKey(t.date) === month &&
      t.amount < 0 &&
      !fixedIds.has(t.id) &&
      // Transfers and savings move money but are not spending.
      t.category !== 'transfers' &&
      t.category !== 'savings'
  )
  return {
    sum: txs.reduce((s, t) => s + Math.abs(t.amount), 0),
    txs
  }
}

export function buildMonthlySummary(
  transactions: Transaction[],
  targetMonth: string
): MonthlySummary | null {
  const txsThisMonth = transactions.filter(t => monthKey(t.date) === targetMonth)
  if (txsThisMonth.length === 0) return null

  const fixedIds = fixedTransactionIds(transactions)
  const { sum: variableExpenses, txs: variableTxs } =
    variableExpensesFor(transactions, targetMonth, fixedIds)

  const income = txsThisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const fixedCount = txsThisMonth.filter(t => t.amount < 0 && fixedIds.has(t.id)).length
  const transactionCount = variableTxs.length

  // Delta vs previous month, also on variable-only basis so we compare like-for-like.
  const [yStr, mStr] = targetMonth.split('-')
  const prevDate = new Date(Number(yStr), Number(mStr) - 2, 1)
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const { sum: prevVariable } = variableExpensesFor(transactions, prevKey, fixedIds)
  const deltaVsPrevious =
    prevVariable > 0 ? ((variableExpenses - prevVariable) / prevVariable) * 100 : null

  const perCat = new Map<string, number>()
  for (const t of variableTxs) {
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
        share: variableExpenses > 0 ? (topEntry[1] / variableExpenses) * 100 : 0
      }
    : null

  const biggestExpense = [...variableTxs].sort((a, b) => a.amount - b.amount)[0] ?? null

  const recurringCost = monthlyRecurringCost(transactions)
  const monthName = monthLabel(targetMonth)

  const text = buildText({
    monthName,
    variableExpenses,
    transactionCount,
    deltaVsPrevious,
    topCategory,
    recurringCost,
    biggestExpense,
    fixedCount
  })

  return {
    month: targetMonth,
    monthName,
    variableExpenses,
    income,
    transactionCount,
    deltaVsPrevious,
    topCategory,
    recurringCost,
    biggestExpense,
    fixedCount,
    text
  }
}

function buildText(data: {
  monthName: string
  variableExpenses: number
  transactionCount: number
  deltaVsPrevious: number | null
  topCategory: { label: string; share: number } | null
  recurringCost: number
  biggestExpense: Transaction | null
  fixedCount: number
}): string {
  const pieces: string[] = []

  const monthCap = data.monthName.charAt(0).toUpperCase() + data.monthName.slice(1)
  const delta = data.deltaVsPrevious
  const deltaStr = delta == null
    ? ''
    : delta > 0
      ? ` (+${Math.round(delta)} % vs mois précédent)`
      : ` (${Math.round(delta)} % vs mois précédent)`

  const exclNote = data.fixedCount > 0 ? ' hors charges fixes' : ''
  pieces.push(
    `**${monthCap}** : ${fmtEuro(-data.variableExpenses)} de dépenses variables${deltaStr} sur ${data.transactionCount} transactions${exclNote}.`
  )

  if (data.topCategory && data.topCategory.share > 0) {
    pieces.push(
      `Top catégorie : **${data.topCategory.label}** (${Math.round(data.topCategory.share)} %).`
    )
  }

  if (data.recurringCost > 0) {
    pieces.push(`Charges récurrentes détectées : ${fmtEuro(-data.recurringCost)}/mois.`)
  }

  if (data.biggestExpense) {
    pieces.push(
      `Plus grosse dépense variable : ${data.biggestExpense.label} (${fmtEuro(data.biggestExpense.amount)}).`
    )
  }

  return pieces.join(' ')
}
