const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
})

export function fmtEuro(n: number): string {
  return currency.format(n)
}

const dateFmtShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })
const dateFmtLong = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric'
})

export function fmtDateShort(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : dateFmtShort.format(d)
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : dateFmtLong.format(d)
}
