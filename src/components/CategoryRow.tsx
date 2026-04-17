import { Link } from 'react-router-dom'
import { categoryById, type CategoryId } from '../types'
import { fmtEuro } from '../format'

interface Props {
  id: CategoryId
  total: number
  count: number
}

export default function CategoryRow({ id, total, count }: Props) {
  const meta = categoryById[id]
  return (
    <Link to={`/category/${id}`} className="row" style={{ '--tile': meta.color } as React.CSSProperties}>
      <div className="icon-tile">{meta.icon}</div>
      <div className="row-body">
        <div className="row-title">{meta.label}</div>
        <div className="row-subtitle">
          {count} transaction{count > 1 ? 's' : ''}
        </div>
      </div>
      <div className={`row-amount ${total < 0 ? 'amount-neg' : 'amount-pos'}`}>
        {fmtEuro(total)}
      </div>
      <span className="chevron">›</span>
    </Link>
  )
}
