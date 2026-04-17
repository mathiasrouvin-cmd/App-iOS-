import { fmtEuro } from '../format'

interface Props {
  spent: number
  budget: number
  color: string
}

export default function BudgetBar({ spent, budget, color }: Props) {
  const ratio = Math.min(spent / budget, 1.2)
  const pct = Math.round((spent / budget) * 100)
  const over = spent > budget

  return (
    <div className="budget-bar">
      <div className="budget-bar-track">
        <div
          className="budget-bar-fill"
          style={{
            width: `${Math.min(ratio, 1) * 100}%`,
            background: over ? 'var(--red)' : color
          }}
        />
      </div>
      <div className="budget-bar-caption">
        <span className={over ? 'amount-neg' : 'secondary'}>
          {fmtEuro(spent)} / {fmtEuro(budget)}
        </span>
        <span className={over ? 'amount-neg' : 'secondary'}>{pct}%</span>
      </div>
    </div>
  )
}
