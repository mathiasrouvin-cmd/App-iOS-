import { fmtEuro } from '../format'

interface Props {
  balance: number
  income: number
  expenses: number
}

export default function SummaryCard({ balance, income, expenses }: Props) {
  return (
    <div className="summary">
      <div className="label">Solde</div>
      <div className="balance">{fmtEuro(balance)}</div>
      <div className="flows">
        <div className="flow">
          <span className="icon">↓</span>
          <div>
            <div className="caption">Revenus</div>
            <div className="value">{fmtEuro(income)}</div>
          </div>
        </div>
        <div className="flow">
          <span className="icon">↑</span>
          <div>
            <div className="caption">Dépenses</div>
            <div className="value">{fmtEuro(expenses)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
