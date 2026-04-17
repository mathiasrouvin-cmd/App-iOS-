import { useEffect, useRef } from 'react'

export interface Bar {
  label: string
  value: number
  highlight?: boolean
}

interface Props {
  bars: Bar[]
  height?: number
  color?: string
  valueFormatter?: (n: number) => string
}

function lighten(hex: string, amount: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return hex
  const adjust = (c: string) =>
    Math.min(255, parseInt(c, 16) + amount).toString(16).padStart(2, '0')
  return `#${adjust(m[1])}${adjust(m[2])}${adjust(m[3])}`
}

function niceScale(max: number): { max: number; step: number } {
  if (max <= 0) return { max: 1, step: 1 }
  const exp = Math.floor(Math.log10(max))
  const base = Math.pow(10, exp)
  const n = max / base
  let step = base
  if (n <= 2) step = base * 0.5
  else if (n <= 5) step = base
  else step = base * 2
  const niceMax = Math.ceil(max / step) * step
  return { max: niceMax, step }
}

export default function BarChart({ bars, height = 220, color = '#14b8a6', valueFormatter }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const width = wrap.clientWidth
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    if (bars.length === 0) return

    const rawMax = Math.max(...bars.map(b => b.value))
    const { max } = niceScale(rawMax)

    const paddingLeft = 36
    const paddingRight = 10
    const paddingTop = 22
    const paddingBottom = 26
    const innerW = width - paddingLeft - paddingRight
    const innerH = height - paddingTop - paddingBottom
    const slot = innerW / bars.length
    const barW = Math.max(12, Math.min(42, slot * 0.55))

    const textColor = getComputedStyle(document.body)
      .getPropertyValue('--text-secondary').trim() || '#9ca3af'
    const gridColor = 'rgba(120,120,128,0.15)'

    ctx.font = '10px -apple-system, system-ui, sans-serif'
    ctx.textBaseline = 'middle'

    // Horizontal grid + y-axis labels
    for (let i = 0; i <= 4; i++) {
      const ratio = i / 4
      const y = paddingTop + innerH * (1 - ratio)
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(paddingLeft, y)
      ctx.lineTo(width - paddingRight, y)
      ctx.stroke()

      const v = max * ratio
      const label = v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${Math.round(v)}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'right'
      ctx.fillText(label, paddingLeft - 6, y)
    }

    // Bars
    ctx.textAlign = 'center'
    bars.forEach((b, i) => {
      const h = max > 0 ? (b.value / max) * innerH : 0
      const x = paddingLeft + slot * i + (slot - barW) / 2
      const y = paddingTop + innerH - h

      const baseColor = b.highlight ? color : color
      const grad = ctx.createLinearGradient(0, y, 0, y + h)
      grad.addColorStop(0, lighten(baseColor, 25))
      grad.addColorStop(1, baseColor)
      ctx.fillStyle = grad
      roundedTop(ctx, x, y, barW, h, Math.min(6, barW / 2))
      ctx.fill()

      if (b.highlight) {
        ctx.strokeStyle = baseColor
        ctx.lineWidth = 1
        roundedTop(ctx, x - 0.5, y - 0.5, barW + 1, h + 1, Math.min(7, barW / 2))
        ctx.stroke()
      }

      ctx.fillStyle = textColor
      const valueLabel = valueFormatter ? valueFormatter(b.value) :
        (b.value >= 1000 ? `${Math.round(b.value / 100) / 10}k` : `${Math.round(b.value)}`)
      ctx.font = '10px -apple-system, system-ui, sans-serif'
      ctx.fillText(valueLabel, x + barW / 2, y - 10)

      ctx.fillText(b.label, x + barW / 2, height - 12)
    })
  }, [bars, height, color, valueFormatter])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <canvas ref={ref} />
    </div>
  )
}

function roundedTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
