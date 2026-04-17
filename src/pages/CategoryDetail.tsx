import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { categoryById, type CategoryId } from '../types'
import { fmtEuro } from '../format'
import TransactionRow from '../components/TransactionRow'

export default function CategoryDetail() {
  const { id } = useParams<{ id: CategoryId }>()
  const { transactions } = useStore()
  const meta = id ? categoryById[id] : undefined

  const items = useMemo(() => {
    return transactions
      .filter(t => t.category === id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [transactions, id])

  const total = items.reduce((s, t) => s + t.amount, 0)

  if (!meta) {
    return (
      <div className="screen">
        <div className="nav">
          <Link to="/" className="nav-btn">‹ Retour</Link>
          <h1>Catégorie inconnue</h1>
          <span className="nav-btn right" />
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="nav">
        <Link to="/" className="nav-btn">‹ Compte</Link>
        <h1>{meta.label}</h1>
        <span className="nav-btn right" />
      </div>

      <div className="container">
        <div className="detail-header" style={{ '--tile': meta.color } as React.CSSProperties}>
          <div className="icon-big">{meta.icon}</div>
          <div className={`amount-big ${total < 0 ? 'amount-neg' : 'amount-pos'}`}>
            {fmtEuro(total)}
          </div>
          <div className="caption">
            {items.length} transaction{items.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="section-title">Transactions</div>
        <div className="card">
          {items.map(t => (
            <TransactionRow key={t.id} transaction={t} showCategoryIcon={false} />
          ))}
          {items.length === 0 && <div className="empty">Aucune transaction.</div>}
        </div>
      </div>
    </div>
  )
}
