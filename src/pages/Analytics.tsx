import { useMemo } from 'react'
import { useStore } from '../store'
import { CATEGORIES, categoryById } from '../types'
import { availableMonths, currentMonthKey, inPeriod, monthKey, monthLabel } from '../utils/date'
import { fmtEuro } from '../format'
import PeriodPicker from '../components/PeriodPicker'
import PieChart from '../components/PieChart'
import BarChart from '../components/BarChart'

export default function Analytics() {
  const { transactions, settings, setPeriod } = useStore()
  const months = useMemo(() => availableMonths(transactions), [transactions])

  const filtered = useMemo(
    () => transactions.filter(t => inPeriod(t, settings.period)),
    [transactions, settings.period]
  )

  const slices = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of filtered) {
      if (t.amount >= 0) continue
      totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount))
    }
    return CATEGORIES
      .map(c => ({
        id: c.id,
        label: c.label,
        color: c.color,
        icon: c.icon,
        value: totals.get(c.id) ?? 0
      }))
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const totalExpenses = slices.reduce((s, x) => s + x.value, 0)
  const totalIncome = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const topCategory = slices[0]

  const bars = useMemo(() => {
    const perMonth = new Map<string, number>()
    for (const t of transactions) {
      if (t.amount >= 0) continue
      const k = monthKey(t.date)
      perMonth.set(k, (perMonth.get(k) ?? 0) + Math.abs(t.amount))
    }
    const entries = Array.from(perMonth.entries()).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-12)
    const cur = currentMonthKey()
    return entries.map(([k, v]) => ({
      label: monthLabel(k, 'short').split(' ')[0].slice(0, 4).replace('.', ''),
      value: v,
      highlight: k === cur || k === settings.period
    }))
  }, [transactions, settings.period])

  const topMerchants = useMemo(() => {
    const totals = new Map<string, { total: number; label: string; category: string }>()
    for (const t of filtered) {
      if (t.amount >= 0) continue
      const key = t.label.slice(0, 40)
      const cur = totals.get(key) ?? { total: 0, label: t.label, category: t.category }
      cur.total += Math.abs(t.amount)
      totals.set(key, cur)
    }
    return Array.from(totals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filtered])

  const monthlyAverage = useMemo(() => {
    const perMonth = new Map<string, number>()
    for (const t of transactions) {
      if (t.amount >= 0) continue
      const k = monthKey(t.date)
      perMonth.set(k, (perMonth.get(k) ?? 0) + Math.abs(t.amount))
    }
    if (perMonth.size === 0) return 0
    const sum = Array.from(perMonth.values()).reduce((s, v) => s + v, 0)
    return sum / perMonth.size
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

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--red)' }}>↑</div>
            <div className="stat-caption">Dépenses</div>
            <div className="stat-value amount-neg">{fmtEuro(-totalExpenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--green)' }}>↓</div>
            <div className="stat-caption">Revenus</div>
            <div className="stat-value amount-pos">{fmtEuro(totalIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(15,118,110,0.12)', color: 'var(--accent)' }}>⌀</div>
            <div className="stat-caption">Moy. mensuelle</div>
            <div className="stat-value">{fmtEuro(-monthlyAverage)}</div>
          </div>
        </div>

        <div className="card analytics-card">
          {slices.length === 0 ? (
            <div className="empty">Aucune dépense sur la période.</div>
          ) : (
            <>
              <div className="donut-hero">
                <div className="donut-canvas-wrap">
                  <PieChart slices={slices} />
                  <div className="donut-center">
                    <div className="donut-center-caption">
                      {topCategory && (
                        <>
                          <span style={{ fontSize: 22 }}>{topCategory.icon}</span>
                          <div className="donut-center-label">{topCategory.label}</div>
                        </>
                      )}
                    </div>
                    <div className="donut-center-value">
                      {topCategory
                        ? `${Math.round((topCategory.value / totalExpenses) * 100)}%`
                        : '—'}
                    </div>
                    <div className="donut-center-sub">{fmtEuro(-totalExpenses)} total</div>
                  </div>
                </div>
              </div>

              <ul className="legend-bars">
                {slices.map(s => {
                  const pct = (s.value / totalExpenses) * 100
                  return (
                    <li key={s.id} className="legend-row">
                      <div className="legend-row-head">
                        <span className="legend-emoji">{s.icon}</span>
                        <span className="legend-title">{s.label}</span>
                        <span className="legend-amount">{fmtEuro(-s.value)}</span>
                      </div>
                      <div className="legend-track">
                        <div
                          className="legend-fill"
                          style={{ width: `${pct}%`, background: s.color }}
                        />
                      </div>
                      <div className="legend-pct">{pct.toFixed(1)}%</div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        {topMerchants.length > 0 && (
          <>
            <div className="section-title">Top dépenses</div>
            <div className="card">
              {topMerchants.map((m, i) => {
                const meta = categoryById[m.category as keyof typeof categoryById]
                const ratio = m.total / topMerchants[0].total
                return (
                  <div key={i} className="row">
                    <div className="icon-tile" style={{ background: meta.color }}>{meta.icon}</div>
                    <div className="row-body">
                      <div className="row-title">{m.label}</div>
                      <div className="merchant-track">
                        <div
                          className="merchant-fill"
                          style={{ width: `${ratio * 100}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                    <div className="row-amount amount-neg">{fmtEuro(-m.total)}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="section-title">Dépenses par mois</div>
        <div className="card" style={{ padding: 14 }}>
          {bars.length === 0
            ? <div className="empty">Pas assez de données.</div>
            : <BarChart bars={bars} />
          }
        </div>
      </div>
    </div>
  )
}
