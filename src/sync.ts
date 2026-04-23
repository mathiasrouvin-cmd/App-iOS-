import type { Transaction } from './types'
import { classify, type CustomRule } from './classifier'

export interface SyncConfig {
  backendUrl: string
  authToken: string
  accounts: SyncAccount[]
  requisitionId: string | null
  institutionId: string | null
  lastSync: string | null
  linkedAt: string | null
}

export interface SyncAccount {
  id: string
  iban?: string
  name?: string
  currency?: string
  balance?: string
}

export interface Institution {
  id: string
  name: string
  logo?: string
}

interface RawTx {
  id: string
  date: string
  label: string
  amount: number
  status: 'booked' | 'pending'
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

export async function ping(cfg: Pick<SyncConfig, 'backendUrl' | 'authToken'>): Promise<boolean> {
  try {
    const r = await fetch(`${stripTrailingSlash(cfg.backendUrl)}/api/ping`, {
      headers: headers(cfg.authToken)
    })
    return r.ok
  } catch {
    return false
  }
}

export async function listInstitutions(
  cfg: Pick<SyncConfig, 'backendUrl' | 'authToken'>,
  country = 'FR'
): Promise<Institution[]> {
  const r = await fetch(
    `${stripTrailingSlash(cfg.backendUrl)}/api/institutions?country=${country}`,
    { headers: headers(cfg.authToken) }
  )
  if (!r.ok) throw new Error(`list institutions ${r.status}`)
  return r.json()
}

export async function createLink(
  cfg: Pick<SyncConfig, 'backendUrl' | 'authToken'>,
  institutionId: string
): Promise<{ link: string; requisition_id: string }> {
  const r = await fetch(`${stripTrailingSlash(cfg.backendUrl)}/api/link`, {
    method: 'POST',
    headers: headers(cfg.authToken),
    body: JSON.stringify({ institution_id: institutionId })
  })
  if (!r.ok) throw new Error(`create link ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function fetchAccounts(
  cfg: Pick<SyncConfig, 'backendUrl' | 'authToken'>,
  requisitionId?: string
): Promise<SyncAccount[]> {
  const suffix = requisitionId ? `?id=${requisitionId}` : ''
  const r = await fetch(`${stripTrailingSlash(cfg.backendUrl)}/api/accounts${suffix}`, {
    headers: headers(cfg.authToken)
  })
  if (!r.ok) throw new Error(`accounts ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function fetchTransactions(
  cfg: Pick<SyncConfig, 'backendUrl' | 'authToken'>,
  accountId: string,
  fromIso?: string
): Promise<RawTx[]> {
  const qs = new URLSearchParams({ account_id: accountId })
  if (fromIso) qs.set('from', fromIso)
  const r = await fetch(
    `${stripTrailingSlash(cfg.backendUrl)}/api/transactions?${qs}`,
    { headers: headers(cfg.authToken) }
  )
  if (!r.ok) throw new Error(`transactions ${r.status}: ${await r.text()}`)
  return r.json()
}

export function rawToTransaction(raw: RawTx, rules: CustomRule[]): Transaction {
  const date = (raw.date || '').slice(0, 10)
  return {
    id: raw.id,
    date,
    label: raw.label || '(sans libellé)',
    amount: raw.amount,
    category: classify(raw.label, raw.amount, rules)
  }
}
