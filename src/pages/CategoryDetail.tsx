import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { categoryById, type CategoryId } from '../types'
import { fmtEuro } from '../format'
import TransactionRow from '../components/TransactionRow'
import { inPeriod, periodLabel } from '../utils/date'
import { IconBack } from '../icons'

export default function CategoryDetail() {
  const { id } = useParams<{ id: CategoryId }>()
  const { transactions, settings } = useStore()
  const meta = id ? categoryById[id] : undefined

  const items = useMemo(() => {
    return transactions
      .filter(t => t.category === id && inPeriod(t, settings.period))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [transactions, id, settings.period])

  const total = items.reduce((s, t) => s + t.amount, 0)

  if (!meta) {
    return (
      <div className="screen">
        <div className="nav">
          <Link to="/" className="nav-btn">
            <IconBack size={20} strokeWidth={2.4} /> Retour
          </Link>
          <h1>Catégorie inconnue</h1>
          <span className="nav-btn right" />
        </div>
      </div>
    )
  }

  const Icon = meta.icon

  return (
    <div className="screen">
      <div className="nav">
        <Link to="/" className="nav-btn">
          <IconBack size={20} strokeWidth={2.4} /> Compte
        </Link>
        <h1>{meta.label}</h1>
        <span className="nav-btn right" />
      </div>

      <div className="container">
        <div className="detail-header" style={{ '--tile': meta.color } as React.CSSProperties}>
          <div className="icon-big">
            <Icon size={38} strokeWidth={1.8} />
          </div>
          <div className={`amount-big ${total < 0 ? 'amount-neg' : 'amount-pos'}`}>
            {fmtEuro(total)}
          </div>
          <div className="caption">
            {items.length} transaction{items.length > 1 ? 's' : ''} · {periodLabel(settings.period)}
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
