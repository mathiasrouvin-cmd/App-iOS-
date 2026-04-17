import { useEffect, useRef } from 'react'

export interface Bar {
  label: string
  value: number
}

interface Props {
  bars: Bar[]
  height?: number
  color?: string
}

export default function BarChart({ bars, height = 180, color = '#0f766e' }: Props) {
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
    const max = Math.max(...bars.map(b => b.value), 1)
    const paddingX = 8
    const paddingBottom = 22
    const paddingTop = 10
    const innerW = width - paddingX * 2
    const innerH = height - paddingBottom - paddingTop
    const slot = innerW / bars.length
    const barW = Math.max(8, Math.min(36, slot * 0.6))

    ctx.font = '11px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#6b7280'

    bars.forEach((b, i) => {
      const h = (b.value / max) * innerH
      const x = paddingX + slot * i + (slot - barW) / 2
      const y = paddingTop + innerH - h
      ctx.fillStyle = color
      roundRect(ctx, x, y, barW, h, Math.min(6, barW / 2))
      ctx.fill()
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#6b7280'
      ctx.fillText(b.label, paddingX + slot * i + slot / 2, height - paddingBottom + 4)
    })
  }, [bars, height, color])

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <canvas ref={ref} />
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
