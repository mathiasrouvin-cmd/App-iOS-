import { Link } from 'react-router-dom'
import type { Transaction } from '../types'
import { categoryById } from '../types'
import { fmtDateShort, fmtEuro } from '../format'

interface Props {
  transaction: Transaction
  showCategoryIcon?: boolean
}

export default function TransactionRow({ transaction: t, showCategoryIcon = true }: Props) {
  const meta = categoryById[t.category]
  return (
    <Link to={`/transaction/${t.id}`} className="row" style={{ '--tile': meta.color } as React.CSSProperties}>
      {showCategoryIcon && (
        <div className="icon-tile" style={{ borderRadius: '50%', width: 32, height: 32, fontSize: 14 }}>
          {meta.icon}
        </div>
      )}
      <div className="row-body">
        <div className="row-title">{t.label}</div>
        <div className="row-subtitle">{fmtDateShort(t.date)}</div>
      </div>
      <div className={`row-amount ${t.amount < 0 ? 'amount-neg' : 'amount-pos'}`}>
        {fmtEuro(t.amount)}
      </div>
      <span className="chevron">›</span>
    </Link>
  )
}
