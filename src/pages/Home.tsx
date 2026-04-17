import { useMemo, useState } from 'react'
import { CATEGORIES } from '../types'
import { useStore } from '../store'
import SummaryCard from '../components/SummaryCard'
import CategoryRow from '../components/CategoryRow'
import ImportButton from '../components/ImportButton'
import PeriodPicker from '../components/PeriodPicker'
import TransactionRow from '../components/TransactionRow'
import { availableMonths, inPeriod } from '../utils/date'
import { IconSearch, IconClose } from '../icons'

export default function Home() {
  const { transactions, settings, error, clearError, setPeriod } = useStore()
  const [query, setQuery] = useState('')

  const months = useMemo(() => availableMonths(transactions), [transactions])
  const filtered = useMemo(
    () => transactions.filter(t => inPeriod(t, settings.period)),
    [transactions, settings.period]
  )

  const { balance, income, expenses, byCategory } = useMemo(() => {
    let income = 0
    let expenses = 0
    const byCategory = new Map<string, { total: number; count: number }>()
    for (const t of filtered) {
      if (t.amount >= 0) income += t.amount
      else expenses += t.amount
      const agg = byCategory.get(t.category) ?? { total: 0, count: 0 }
      agg.total += t.amount
      agg.count += 1
      byCategory.set(t.category, agg)
    }
    return { balance: income + expenses, income, expenses, byCategory }
  }, [filtered])

  const activeCategories = CATEGORIES.filter(c => byCategory.has(c.id))

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return filtered
      .filter(t => t.label.toLowerCase().includes(q))
      .slice(0, 80)
  }, [query, filtered])

  const showBudgets = settings.period !== 'all'

  return (
    <div className="screen with-tabbar">
      <div className="nav">
        <span className="nav-btn" />
        <h1>Mon compte</h1>
        <ImportButton />
      </div>

      <div className="container">
        <SummaryCard balance={balance} income={income} expenses={expenses} />

        <PeriodPicker months={months} value={settings.period} onChange={setPeriod} />

        <div className="search-wrap">
          <span className="search-icon">
            <IconSearch size={18} strokeWidth={2} />
          </span>
          <input
            type="search"
            placeholder="Rechercher une transaction…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="search-clear" aria-label="Effacer">
              <IconClose size={12} strokeWidth={3} />
            </button>
          )}
        </div>

        {query ? (
          <>
            <div className="section-title">
              {matches.length} résultat{matches.length > 1 ? 's' : ''}
            </div>
            <div className="card">
              {matches.length === 0
                ? <div className="empty">Rien trouvé pour « {query} ».</div>
                : matches.map(t => <TransactionRow key={t.id} transaction={t} />)
              }
            </div>
          </>
        ) : activeCategories.length > 0 ? (
          <>
            <div className="section-title">Catégories</div>
            <div className="card">
              {activeCategories.map(c => {
                const agg = byCategory.get(c.id)!
                return (
                  <CategoryRow
                    key={c.id}
                    id={c.id}
                    total={agg.total}
                    count={agg.count}
                    budget={showBudgets ? settings.budgets[c.id] : undefined}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <div className="card empty">
            Aucune transaction. Touchez <b>Importer</b> pour charger un CSV.
          </div>
        )}

        {error && (
          <div className="toast" onClick={clearError}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
