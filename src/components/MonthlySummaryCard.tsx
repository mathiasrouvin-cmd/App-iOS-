import type { LucideIcon } from 'lucide-react'
import type { MonthlySummary } from '../summary'

interface Props {
  summary: MonthlySummary
}

export default function MonthlySummaryCard({ summary }: Props) {
  const TopIcon = summary.topCategory?.icon as LucideIcon | undefined
  return (
    <div className="monthly-summary">
      <div className="monthly-summary-head">
        <span className="monthly-summary-badge">Ton mois en bref</span>
        {TopIcon && summary.topCategory && (
          <div
            className="monthly-summary-topicon"
            style={{ background: summary.topCategory.color }}
          >
            <TopIcon size={14} strokeWidth={2.4} />
          </div>
        )}
      </div>
      <p className="monthly-summary-text">{renderRich(summary.text)}</p>
    </div>
  )
}

// Render **bold** markers inside the generated sentence.
function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
