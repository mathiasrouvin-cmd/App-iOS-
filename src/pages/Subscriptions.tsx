import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { categoryById } from '../types'
import { cadenceLabel, detectSubscriptions } from '../subscriptions'
import { fmtDateShort, fmtEuro } from '../format'

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
          <div className="label">Coût mensuel estimé</div>
          <div className="balance">{fmtEuro(-monthlyTotal)}</div>
          <div className="flows">
            <div className="flow">
              <span className="icon">🔁</span>
              <div>
                <div className="caption">Paiements récurrents</div>
                <div className="value">{subs.length}</div>
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
            return (
              <Link
                to={`/transaction/${last.id}`}
                key={s.key}
                className="row"
                style={{ '--tile': meta.color } as React.CSSProperties}
              >
                <div className="icon-tile">{meta.icon}</div>
                <div className="row-body">
                  <div className="row-title">{last.label}</div>
                  <div className="row-subtitle">
                    {cadenceLabel(s.cadence)} · {s.samples.length}× · dernier {fmtDateShort(s.lastSeen)}
                  </div>
                </div>
                <div className="row-amount amount-neg">
                  {fmtEuro(-s.monthlyCost)}
                  <div className="secondary" style={{ fontSize: 11, fontWeight: 400 }}>/mois</div>
                </div>
                <span className="chevron">›</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
