import { classify } from './classifier'
import type { Transaction } from './types'

export class CsvImportError extends Error {}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map(f => f.replace(/^"+|"+$/g, '').trim())
}

function detectSeparator(line: string): string {
  const semis = (line.match(/;/g) ?? []).length
  const commas = (line.match(/,/g) ?? []).length
  const tabs = (line.match(/\t/g) ?? []).length
  if (tabs > semis && tabs > commas) return '\t'
  return semis >= commas ? ';' : ','
}

function parseDate(raw: string): string | null {
  const t = raw.trim()
  // yyyy-mm-dd
  let m = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  // dd/mm/yyyy or dd-mm-yyyy
  m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // dd/mm/yy
  m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/)
  if (m) {
    const year = Number(m[3]) + (Number(m[3]) < 50 ? 2000 : 1900)
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  const d = new Date(t)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function parseAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/[€$£\s\u00A0]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // strip thousand dots
    .replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function findColumn(header: string[], needles: string[]): number {
  return header.findIndex(h => needles.some(n => h.includes(n)))
}

export function parseCsv(content: string): Transaction[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) throw new CsvImportError('Le fichier CSV est vide.')

  const sep = detectSeparator(lines[0])
  const header = splitLine(lines[0], sep).map(h => h.toLowerCase())

  const dateIdx = findColumn(header, ['date'])
  const labelIdx = findColumn(header, ['libell', 'label', 'description', 'intitul', 'motif'])
  const amountIdx = findColumn(header, ['montant', 'amount', 'valeur'])
  const debitIdx = findColumn(header, ['debit'])
  const creditIdx = findColumn(header, ['credit'])

  if (dateIdx < 0 || labelIdx < 0 || (amountIdx < 0 && debitIdx < 0 && creditIdx < 0)) {
    throw new CsvImportError(
      'Colonnes manquantes. Attendu: date, libellé, montant (ou débit/crédit).'
    )
  }

  const transactions: Transaction[] = []
  for (let i = 1; i < lines.length; i++) {
    const fields = splitLine(lines[i], sep)
    if (fields.length < header.length - 1) continue

    const dateRaw = fields[dateIdx] ?? ''
    const label = (fields[labelIdx] ?? '').trim()
    const date = parseDate(dateRaw)
    if (!date || !label) continue

    let amount: number | null = null
    if (amountIdx >= 0) {
      amount = parseAmount(fields[amountIdx] ?? '')
    } else {
      const debit = parseAmount(fields[debitIdx] ?? '') ?? 0
      const credit = parseAmount(fields[creditIdx] ?? '') ?? 0
      amount = credit - Math.abs(debit)
    }
    if (amount == null || !Number.isFinite(amount)) continue

    transactions.push({
      id: cryptoRandomId(),
      date,
      label,
      amount,
      category: classify(label, amount)
    })
  }

  return transactions
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Lecture impossible'))
    reader.readAsText(file, 'utf-8')
  })
}
