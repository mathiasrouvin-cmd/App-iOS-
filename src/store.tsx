import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode
} from 'react'
import type { CategoryId, Transaction } from './types'
import { parseCsv } from './csv'

const STORAGE_KEY = 'banking-pwa:transactions'

interface StoreValue {
  transactions: Transaction[]
  importFromText: (text: string) => { added: number }
  updateCategory: (id: string, category: CategoryId) => void
  deleteTransaction: (id: string) => void
  reset: () => void
  error: string | null
  clearError: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function load(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Transaction[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function dedupKey(t: Transaction): string {
  return `${t.date}|${t.label}|${t.amount.toFixed(2)}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => load())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  const importFromText = useCallback((text: string) => {
    try {
      const incoming = parseCsv(text)
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
  }, [])

  const updateCategory = useCallback((id: string, category: CategoryId) => {
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, category } : t)))
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  const reset = useCallback(() => setTransactions([]), [])
  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<StoreValue>(() => ({
    transactions, importFromText, updateCategory, deleteTransaction, reset, error, clearError
  }), [transactions, importFromText, updateCategory, deleteTransaction, reset, error, clearError])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
