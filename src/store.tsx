import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode
} from 'react'
import type { CategoryId, Transaction } from './types'
import { classify, type CustomRule } from './classifier'
import { parseCsv } from './csv'
import type { Period } from './utils/date'

const KEY_TXS = 'banking-pwa:transactions'
const KEY_SETTINGS = 'banking-pwa:settings'

export interface Settings {
  rules: CustomRule[]
  budgets: Partial<Record<CategoryId, number>>
  period: Period
  lockEnabled: boolean
  credentialId: string | null
}

const DEFAULT_SETTINGS: Settings = {
  rules: [],
  budgets: {},
  period: 'all',
  lockEnabled: false,
  credentialId: null
}

interface StoreValue {
  transactions: Transaction[]
  settings: Settings
  error: string | null

  importFromText: (text: string) => { added: number }
  updateCategory: (id: string, category: CategoryId) => void
  deleteTransaction: (id: string) => void
  reset: () => void
  clearError: () => void
  reclassifyAll: () => number

  setPeriod: (p: Period) => void
  addRule: (keyword: string, category: CategoryId) => void
  deleteRule: (id: string) => void
  setBudget: (category: CategoryId, amount: number | null) => void
  enableLock: (credentialId: string) => void
  disableLock: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEY_TXS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Transaction[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function dedupKey(t: Transaction): string {
  return `${t.date}|${t.label}|${t.amount.toFixed(2)}`
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(KEY_TXS, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings))
  }, [settings])

  const importFromText = useCallback((text: string) => {
    try {
      const incoming = parseCsv(text, settings.rules)
      let added = 0
      setTransactions(prev => {
        const seen = new Set(prev.map(dedupKey))
        const merged = [...prev]
        for (const tx of incoming) {
          if (!seen.has(dedupKey(tx))) {
            merged.push(tx)
            seen.add(dedupKey(tx))
            added++
          }
        }
        merged.sort((a, b) => (a.date < b.date ? 1 : -1))
        return merged
      })
      setError(null)
      return { added }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return { added: 0 }
    }
  }, [settings.rules])

  const updateCategory = useCallback((id: string, category: CategoryId) => {
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, category } : t)))
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  const reset = useCallback(() => setTransactions([]), [])
  const clearError = useCallback(() => setError(null), [])

  const reclassifyAll = useCallback((): number => {
    let changed = 0
    setTransactions(prev => prev.map(t => {
      const next = classify(t.label, t.amount, settings.rules)
      if (next !== t.category) changed++
      return { ...t, category: next }
    }))
    return changed
  }, [settings.rules])

  const setPeriod = useCallback((p: Period) => {
    setSettings(s => ({ ...s, period: p }))
  }, [])

  const addRule = useCallback((keyword: string, category: CategoryId) => {
    const kw = keyword.trim()
    if (!kw) return
    setSettings(s => ({
      ...s,
      rules: [...s.rules, { id: randomId(), keyword: kw, category }]
    }))
  }, [])

  const deleteRule = useCallback((id: string) => {
    setSettings(s => ({ ...s, rules: s.rules.filter(r => r.id !== id) }))
  }, [])

  const setBudget = useCallback((category: CategoryId, amount: number | null) => {
    setSettings(s => {
      const budgets = { ...s.budgets }
      if (amount == null || amount <= 0) {
        delete budgets[category]
      } else {
        budgets[category] = amount
      }
      return { ...s, budgets }
    })
  }, [])

  const enableLock = useCallback((credentialId: string) => {
    setSettings(s => ({ ...s, lockEnabled: true, credentialId }))
  }, [])

  const disableLock = useCallback(() => {
    setSettings(s => ({ ...s, lockEnabled: false, credentialId: null }))
  }, [])

  const value = useMemo<StoreValue>(() => ({
    transactions,
    settings,
    error,
    importFromText,
    updateCategory,
    deleteTransaction,
    reset,
    clearError,
    reclassifyAll,
    setPeriod,
    addRule,
    deleteRule,
    setBudget,
    enableLock,
    disableLock
  }), [
    transactions, settings, error,
    importFromText, updateCategory, deleteTransaction, reset, clearError, reclassifyAll,
    setPeriod, addRule, deleteRule, setBudget, enableLock, disableLock
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
