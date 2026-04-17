import type { Transaction } from './types'
import { monthKey } from './utils/date'

export interface Forecast {
  month: string
  daysElapsed: number
  daysInMonth: number
  expensesSoFar: number
  incomeSoFar: number
  dailyRate: number
  projectedExpenses: number
  projectedBalance: number
  confidence: 'low' | 'medium' | 'high'
}

export function forecastCurrentMonth(transactions: Transaction[]): Forecast | null {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysElapsed = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  if (daysElapsed >= daysInMonth) return null

  const curKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const txs = transactions.filter(t => monthKey(t.date) === curKey)
  if (txs.length === 0) return null

  const expensesSoFar = txs
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + t.amount, 0)
  const incomeSoFar = txs
    .filter(t => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  const dailyRate = expensesSoFar / Math.max(daysElapsed, 1)
  const projectedExpenses = dailyRate * daysInMonth
  const projectedBalance = incomeSoFar + projectedExpenses

  const confidence: Forecast['confidence'] =
    daysElapsed < 5 ? 'low' : daysElapsed < 15 ? 'medium' : 'high'

  return {
    month: curKey,
    daysElapsed,
    daysInMonth,
    expensesSoFar,
    incomeSoFar,
    dailyRate,
    projectedExpenses,
    projectedBalance,
    confidence
  }
}
