import { useMemo } from 'react'
import { useStore } from '../store'
import { CATEGORIES, categoryById } from '../types'
import { availableMonths, inPeriod, monthKey, monthLabel } from '../utils/date'
import { fmtEuro } from '../format'
import PeriodPicker from '../components/PeriodPicker'
import PieChart from '../components/PieChart'
import BarChart from '../components/BarChart'

export default function Analytics() {
  const { transactions, settings, setPeriod } = useStore()
  const months = useMemo(() => availableMonths(transactions), [transactions])

  const filtered = transactions.filter(t => inPeriod(t, settings.period))

  const slices = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of filtered) {
      if (t.amount >= 0) continue
      totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount))
    }
    return CATEGORIES
      .map(c => ({
        label: c.label,
        color: c.color,
        value: totals.get(c.id) ?? 0
      }))
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const totalExpenses = slices.reduce((s, x) => s + x.value, 0)

  const bars = useMemo(() => {
    const perMonth = new Map<string, number>()
    for (const t of transactions) {
      if (t.amount >= 0) continue
      const k = monthKey(t.date)
      perMonth.set(k, (perMonth.get(k) ?? 0) + Math.abs(t.amount))
    }
    return Array.from(perMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-12)
      .map(([k, v]) => ({
        label: monthLabel(k, 'short').split(' ')[0].slice(0, 4),
        value: v
      }))
  }, [transactions])

  return (
    <div className="screen with-tabbar">
      <div className="nav">
        <span className="nav-btn" />
        <h1>Analyse</h1>
        <span className="nav-btn right" />
      </div>

      <div className="container">
        <PeriodPicker months={months} value={settings.period} onChange={setPeriod} />

        <div className="section-title">Répartition des dépenses</div>
        <div className="card" style={{ padding: 16 }}>
          {slices.length === 0 ? (
            <div className="empty">Aucune dépense sur la période.</div>
          ) : (
            <div className="pie-wrap">
              <div className="pie-canvas-wrap">
                <PieChart slices={slices} />
                <div className="pie-center">
                  <div className="pie-center-label">Total</div>
                  <div className="pie-center-value">{fmtEuro(-totalExpenses)}</div>
                </div>
              </div>
              <ul className="legend">
                {slices.map(s => {
                  const pct = Math.round((s.value / totalExpenses) * 100)
                  const id = CATEGORIES.find(c => c.label === s.label)?.id
                  const meta = id ? categoryById[id] : null
                  return (
                    <li key={s.label}>
                      <span className="legend-dot" style={{ background: s.color }} />
                      <span className="legend-label">
                        {meta?.icon} {s.label}
                      </span>
                      <span className="legend-value">
                        {fmtEuro(-s.value)} · {pct}%
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="section-title">Dépenses par mois</div>
        <div className="card" style={{ padding: 12 }}>
          {bars.length === 0
            ? <div className="empty">Pas assez de données.</div>
            : <BarChart bars={bars} />
          }
        </div>
      </div>
    </div>
  )
}
