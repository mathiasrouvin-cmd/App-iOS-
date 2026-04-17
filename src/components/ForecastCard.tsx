import type { Forecast } from '../forecast'
import { fmtEuro } from '../format'
import { monthLabel } from '../utils/date'

interface Props {
  forecast: Forecast
}

export default function ForecastCard({ forecast }: Props) {
  const { projectedBalance, daysElapsed, daysInMonth, confidence, month } = forecast
  const progress = daysElapsed / daysInMonth
  const confLabel =
    confidence === 'low' ? 'faible confiance'
      : confidence === 'medium' ? 'confiance moyenne'
        : 'confiance élevée'

  return (
    <div className="forecast-card">
      <div className="forecast-head">
        <div className="forecast-caption">
          Projection fin {monthLabel(month).split(' ')[0]}
        </div>
        <span className={`forecast-pill forecast-pill-${confidence}`}>{confLabel}</span>
      </div>
      <div className={`forecast-value ${projectedBalance < 0 ? 'amount-neg' : 'amount-pos'}`}>
        {fmtEuro(projectedBalance)}
      </div>
      <div className="forecast-track">
        <div className="forecast-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="forecast-sub">
        Basé sur {daysElapsed} jour{daysElapsed > 1 ? 's' : ''} · rythme {fmtEuro(forecast.dailyRate)}/jour
      </div>
    </div>
  )
}
