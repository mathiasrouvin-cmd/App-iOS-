import { useEffect, useRef } from 'react'

export interface PieSlice {
  value: number
  color: string
  label: string
}

interface Props {
  slices: PieSlice[]
  size?: number
}

function lighten(hex: string, amount: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return hex
  const adjust = (c: string) =>
    Math.min(255, parseInt(c, 16) + amount).toString(16).padStart(2, '0')
  return `#${adjust(m[1])}${adjust(m[2])}${adjust(m[3])}`
}

export default function PieChart({ slices, size = 240 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const total = slices.reduce((s, x) => s + x.value, 0)
    const cx = size / 2
    const cy = size / 2
    const ringWidth = 30
    const outerR = size / 2 - 6
    const innerR = outerR - ringWidth
    const gap = slices.length > 1 ? 0.02 : 0

    if (total <= 0) {
      ctx.lineWidth = ringWidth
      ctx.strokeStyle = 'rgba(120,120,128,0.2)'
      ctx.beginPath()
      ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2)
      ctx.stroke()
      return
    }

    let start = -Math.PI / 2
    for (const slice of slices) {
      const angle = (slice.value / total) * Math.PI * 2
      if (angle <= 0.001) { start += angle; continue }

      const a0 = start + gap / 2
      const a1 = start + angle - gap / 2
      if (a1 <= a0) { start += angle; continue }

      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR)
      grad.addColorStop(0, lighten(slice.color, 30))
      grad.addColorStop(1, slice.color)

      ctx.beginPath()
      ctx.arc(cx, cy, outerR, a0, a1)
      ctx.arc(cx, cy, innerR, a1, a0, true)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      start += angle
    }
  }, [slices, size])

  return <canvas ref={ref} aria-label="Répartition des dépenses" />
}
