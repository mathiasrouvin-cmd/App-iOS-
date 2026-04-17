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

export default function PieChart({ slices, size = 220 }: Props) {
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
    const radius = size / 2 - 6
    const innerRadius = radius * 0.58

    if (total <= 0) {
      ctx.fillStyle = 'rgba(120,120,128,0.2)'
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    let start = -Math.PI / 2
    for (const slice of slices) {
      const angle = (slice.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, start + angle)
      ctx.closePath()
      ctx.fillStyle = slice.color
      ctx.fill()
      start += angle
    }

    // donut hole
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }, [slices, size])

  return <canvas ref={ref} aria-label="Répartition des dépenses" />
}
