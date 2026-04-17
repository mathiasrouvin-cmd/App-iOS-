import type { Period } from '../utils/date'
import { monthLabel } from '../utils/date'

interface Props {
  months: string[]
  value: Period
  onChange: (p: Period) => void
}

export default function PeriodPicker({ months, value, onChange }: Props) {
  const options: Array<{ key: Period; label: string }> = [
    { key: 'all', label: 'Tout' },
    ...months.map(m => ({ key: m as Period, label: monthLabel(m, 'short') }))
  ]

  return (
    <div className="period-picker">
      {options.map(opt => (
        <button
          key={opt.key}
          className={`period-chip ${value === opt.key ? 'period-chip-active' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
