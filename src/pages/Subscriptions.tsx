import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { categoryById } from '../types'
import { cadenceLabel, detectSubscriptions } from '../subscriptions'
import { fmtDateShort, fmtEuro } from '../format'
import { IconChevron, IconRepeat } from '../icons'

export default function Subscriptions() {
  const { transactions } = useStore()
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions])
  const monthlyTotal = subs.reduce((s, x) => s + x.monthlyCost, 0)

  return (
    <div className="screen with-tabbar">
      <div className="nav">
        <span className="nav-btn" />
        <h1>Abonnements</h1>
        <span className="nav-btn right" />
      </div>

      <div className="container">
        <div className="summary">
          <div className="summary-label">Coût mensuel estimé</div>
          <div className="summary-balance">{fmtEuro(-monthlyTotal)}</div>
          <div className="summary-flows">
            <div className="summary-flow">
              <div className="summary-flow-icon">
                <IconRepeat size={16} strokeWidth={2.2} />
              </div>
              <div>
                <div className="summary-flow-caption">Paiements récurrents</div>
                <div className="summary-flow-value">{subs.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-title">Détectés</div>
        <div className="card">
          {subs.length === 0 ? (
            <div className="empty">
              Aucun paiement récurrent détecté. Il faut au moins 2 passages du même marchand.
            </div>
          ) : subs.map(s => {
            const last = s.samples[s.samples.length - 1]
            const meta = categoryById[last.category]
            const Icon = meta.icon
            return (
              <Link
                to={`/transaction/${last.id}`}
                key={s.key}
                className="row"
                style={{ '--tile': meta.color } as React.CSSProperties}
              >
                <div className="icon-tile">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="row-body">
                  <div className="row-title">{last.label}</div>
                  <div className="row-subtitle">
                    {cadenceLabel(s.cadence)} · {s.samples.length}× · {fmtDateShort(s.lastSeen)}
                  </div>
                </div>
                <div className="row-amount amount-neg" style={{ textAlign: 'right' }}>
                  <div>{fmtEuro(-s.monthlyCost)}</div>
                  <div className="secondary" style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}>/mois</div>
                </div>
                <span className="chevron">
                  <IconChevron size={18} strokeWidth={2.5} />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
