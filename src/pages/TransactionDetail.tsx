import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES, categoryById, type CategoryId } from '../types'
import { useStore } from '../store'
import { fmtDateLong, fmtEuro } from '../format'

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const { transactions, updateCategory, deleteTransaction } = useStore()
  const navigate = useNavigate()

  const tx = transactions.find(t => t.id === id)

  if (!tx) {
    return (
      <div className="screen">
        <div className="nav">
          <Link to="/" className="nav-btn">‹ Retour</Link>
          <h1>Introuvable</h1>
          <span className="nav-btn right" />
        </div>
      </div>
    )
  }

  const meta = categoryById[tx.category]

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-btn" onClick={() => navigate(-1)}>‹ Retour</button>
        <h1>Détail</h1>
        <span className="nav-btn right" />
      </div>

      <div className="container">
        <div className="detail-header" style={{ '--tile': meta.color } as React.CSSProperties}>
          <div className="icon-big">{meta.icon}</div>
          <div className={`amount-big ${tx.amount < 0 ? 'amount-neg' : 'amount-pos'}`}>
            {fmtEuro(tx.amount)}
          </div>
          <div className="caption">{tx.label}</div>
        </div>

        <div className="section-title">Informations</div>
        <div className="field-group">
          <div className="field">
            <span className="k">Date</span>
            <span className="v">{fmtDateLong(tx.date)}</span>
          </div>
          <div className="field">
            <span className="k">Libellé</span>
            <span className="v" style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tx.label}
            </span>
          </div>
          <div className="field">
            <span className="k">Montant</span>
            <span className={`v ${tx.amount < 0 ? 'amount-neg' : 'amount-pos'}`}>
              {fmtEuro(tx.amount)}
            </span>
          </div>
        </div>

        <div className="section-title">Catégorie</div>
        <div className="field-group">
          <div className="field">
            <span className="k">Catégorie</span>
            <select
              value={tx.category}
              onChange={e => updateCategory(tx.id, e.target.value as CategoryId)}
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            className="danger"
            onClick={() => {
              if (confirm('Supprimer cette transaction ?')) {
                deleteTransaction(tx.id)
                navigate(-1)
              }
            }}
          >
            Supprimer la transaction
          </button>
        </div>
      </div>
    </div>
  )
}
