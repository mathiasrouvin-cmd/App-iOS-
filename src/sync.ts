import type { Transaction } from './types'
import { classify, type CustomRule } from './classifier'

export interface SyncConfig {
  backendUrl: string
  authToken: string
  accounts: SyncAccount[]
  requisitionId: string | null     // legacy name, now stores authorization_id
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
  country?: string
}

interface RawTx {
  id: string
  date: string
  label: string
  amount: number
  status: 'booked' | 'pending'
}

type Cfg = Pick<SyncConfig, 'backendUrl' | 'authToken'>

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

function baseUrl(cfg: Cfg): string {
  return cfg.backendUrl.replace(/\/$/, '')
}

export async function ping(cfg: Cfg): Promise<boolean> {
  try {
    const r = await fetch(`${baseUrl(cfg)}/api/ping`, { headers: headers(cfg.authToken) })
    return r.ok
  } catch {
    return false
  }
}

export async function listInstitutions(cfg: Cfg, country = 'FR'): Promise<Institution[]> {
  const r = await fetch(`${baseUrl(cfg)}/api/institutions?country=${country}`, {
    headers: headers(cfg.authToken)
  })
  if (!r.ok) throw new Error(`institutions ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function createLink(
  cfg: Cfg,
  institutionId: string,
  redirectUrl?: string
): Promise<{ link: string; authorization_id: string; state: string }> {
  const r = await fetch(`${baseUrl(cfg)}/api/link`, {
    method: 'POST',
    headers: headers(cfg.authToken),
    body: JSON.stringify({
      institution_id: institutionId,
      redirect_url: redirectUrl
    })
  })
  if (!r.ok) throw new Error(`link ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function createSession(
  cfg: Cfg,
  code: string
): Promise<{ session_id: string; valid_until?: string; accounts: SyncAccount[] }> {
  const r = await fetch(`${baseUrl(cfg)}/api/session`, {
    method: 'POST',
    headers: headers(cfg.authToken),
    body: JSON.stringify({ code })
  })
  if (!r.ok) throw new Error(`session ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function fetchAccounts(cfg: Cfg): Promise<SyncAccount[]> {
  const r = await fetch(`${baseUrl(cfg)}/api/accounts`, { headers: headers(cfg.authToken) })
  if (!r.ok) throw new Error(`accounts ${r.status}: ${await r.text()}`)
  return r.json()
}

export async function fetchTransactions(
  cfg: Cfg,
  accountId: string,
  fromIso?: string
): Promise<RawTx[]> {
  const qs = new URLSearchParams({ account_id: accountId })
  if (fromIso) qs.set('from', fromIso)
  const r = await fetch(`${baseUrl(cfg)}/api/transactions?${qs}`, {
    headers: headers(cfg.authToken)
  })
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
