import { useEffect, useRef } from 'react'

interface Props {
  score: number
  color: string
  size?: number
  thickness?: number
}

export default function ScoreRing({ score, color, size = 140, thickness = 12 }: Props) {
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

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - thickness / 2 - 2

    // Background ring
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(120,120,128,0.18)'
    ctx.lineWidth = thickness
    ctx.lineCap = 'round'
    ctx.stroke()

    // Progress arc
    const pct = Math.max(0, Math.min(100, score)) / 100
    if (pct > 0) {
      const start = -Math.PI / 2
      const end = start + pct * Math.PI * 2

      const grad = ctx.createLinearGradient(0, 0, size, size)
      grad.addColorStop(0, lighten(color, 30))
      grad.addColorStop(1, color)

      ctx.beginPath()
      ctx.arc(cx, cy, radius, start, end)
      ctx.strokeStyle = grad
      ctx.lineWidth = thickness
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }, [score, color, size, thickness])

  return <canvas ref={ref} />
}

function lighten(hex: string, amount: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return hex
  const adjust = (c: string) =>
    Math.min(255, parseInt(c, 16) + amount).toString(16).padStart(2, '0')
  return `#${adjust(m[1])}${adjust(m[2])}${adjust(m[3])}`
}
