import { fmtEuro } from '../format'
import { IconTrendDown, IconTrendUp } from '../icons'

interface Props {
  balance: number
  income: number
  expenses: number
}

export default function SummaryCard({ balance, income, expenses }: Props) {
  return (
    <div className="summary">
      <div className="summary-label">Solde</div>
      <div className="summary-balance">{fmtEuro(balance)}</div>
      <div className="summary-flows">
        <div className="summary-flow">
          <div className="summary-flow-icon">
            <IconTrendUp size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className="summary-flow-caption">Revenus</div>
            <div className="summary-flow-value">{fmtEuro(income)}</div>
          </div>
        </div>
        <div className="summary-flow">
          <div className="summary-flow-icon">
            <IconTrendDown size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className="summary-flow-caption">Dépenses</div>
            <div className="summary-flow-value">{fmtEuro(expenses)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
