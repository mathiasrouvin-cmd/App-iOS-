import { useMemo } from 'react'
import { CATEGORIES } from '../types'
import { useStore } from '../store'
import SummaryCard from '../components/SummaryCard'
import CategoryRow from '../components/CategoryRow'
import ImportButton from '../components/ImportButton'

export default function Home() {
  const { transactions, error, clearError, reset } = useStore()

  const { balance, income, expenses, byCategory } = useMemo(() => {
    let income = 0
    let expenses = 0
    const byCategory = new Map<string, { total: number; count: number }>()
    for (const t of transactions) {
      if (t.amount >= 0) income += t.amount
      else expenses += t.amount
      const agg = byCategory.get(t.category) ?? { total: 0, count: 0 }
      agg.total += t.amount
      agg.count += 1
      byCategory.set(t.category, agg)
    }
    return { balance: income + expenses, income, expenses, byCategory }
  }, [transactions])

  const activeCategories = CATEGORIES.filter(c => byCategory.has(c.id))

  return (
    <div className="screen">
      <div className="nav">
        <span className="nav-btn" />
        <h1>Mon compte</h1>
        <ImportButton />
      </div>

      <div className="container">
        <SummaryCard balance={balance} income={income} expenses={expenses} />

        {activeCategories.length > 0 && (
          <>
            <div className="section-title">Catégories</div>
            <div className="card">
              {activeCategories.map(c => {
                const agg = byCategory.get(c.id)!
                return <CategoryRow key={c.id} id={c.id} total={agg.total} count={agg.count} />
              })}
            </div>
          </>
        )}

        {transactions.length === 0 && (
          <div className="card empty">
            Aucune transaction. Touchez <b>Importer</b> pour charger un CSV.
          </div>
        )}

        {transactions.length > 0 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              className="danger"
              onClick={() => {
                if (confirm('Supprimer toutes les transactions ?')) reset()
              }}
            >
              Effacer toutes les données
            </button>
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
