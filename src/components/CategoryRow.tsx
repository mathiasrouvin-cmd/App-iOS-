import { Link } from 'react-router-dom'
import { categoryById, type CategoryId } from '../types'
import { fmtEuro } from '../format'
import BudgetBar from './BudgetBar'

interface Props {
  id: CategoryId
  total: number
  count: number
  budget?: number
}

export default function CategoryRow({ id, total, count, budget }: Props) {
  const meta = categoryById[id]
  const spent = total < 0 ? -total : 0
  const showBudget = budget != null && budget > 0 && total < 0

  return (
    <Link
      to={`/category/${id}`}
      className="row row-stacked"
      style={{ '--tile': meta.color } as React.CSSProperties}
    >
      <div className="row-main">
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
      </div>
      {showBudget && (
        <BudgetBar spent={spent} budget={budget!} color={meta.color} />
      )}
    </Link>
  )
}
