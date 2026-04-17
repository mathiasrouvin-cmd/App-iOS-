import { Link } from 'react-router-dom'
import type { Transaction } from '../types'
import { categoryById } from '../types'
import { fmtDateShort, fmtEuro } from '../format'
import { IconChevron } from '../icons'

interface Props {
  transaction: Transaction
  showCategoryIcon?: boolean
}

export default function TransactionRow({ transaction: t, showCategoryIcon = true }: Props) {
  const meta = categoryById[t.category]
  const Icon = meta.icon
  return (
    <Link
      to={`/transaction/${t.id}`}
      className="row"
      style={{ '--tile': meta.color } as React.CSSProperties}
    >
      {showCategoryIcon && (
        <div className="icon-tile circle">
          <Icon size={16} strokeWidth={2.2} />
        </div>
      )}
      <div className="row-body">
        <div className="row-title">{t.label}</div>
        <div className="row-subtitle">{fmtDateShort(t.date)}</div>
      </div>
      <div className={`row-amount ${t.amount < 0 ? 'amount-neg' : 'amount-pos'}`}>
        {fmtEuro(t.amount)}
      </div>
      <span className="chevron">
        <IconChevron size={18} strokeWidth={2.5} />
      </span>
    </Link>
  )
}
