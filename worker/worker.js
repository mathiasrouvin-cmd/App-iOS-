// Cloudflare Worker — Enable Banking bridge for BankingApp PWA.
// Deploy via Cloudflare dashboard: Workers & Pages > Create > paste this file.
//
// Required bindings (dashboard > Worker > Settings > Variables and Secrets):
//   Secret:   APP_SECRET           random long string, also in the PWA
//   Secret:   APP_PRIVATE_KEY      PEM content of the .pem downloaded from
//                                  Enable Banking when you created the app
//                                  (paste the whole thing, BEGIN/END lines
//                                  and newlines included)
//   Variable: APP_ID               the UUID Enable Banking gave you
//                                  (filename of the .pem or "Banking-pwa (…)")
//   Variable: PWA_URL              public URL of the PWA, used as the redirect
//                                  target, e.g. https://mathiasrouvin-cmd.github.io/App-iOS-/
//   KV binding: KV                 create a KV namespace, bind it as "KV"
//
// The PWA calls this worker with `Authorization: Bearer <APP_SECRET>`.
// The worker signs JWTs with APP_PRIVATE_KEY and proxies to the
// Enable Banking API.

const EB_BASE = 'https://api.enablebanking.com'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400'
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    if (!checkAuth(request, env.APP_SECRET)) {
      return json({ error: 'unauthorized' }, 401)
    }

    try {
      if (url.pathname === '/api/ping') return json({ ok: true })
      if (url.pathname === '/api/institutions') return listInstitutions(url, env)
      if (url.pathname === '/api/link' && request.method === 'POST') return createLink(request, env)
      if (url.pathname === '/api/session' && request.method === 'POST') return createSession(request, env)
      if (url.pathname === '/api/accounts') return listAccounts(env)
      if (url.pathname === '/api/transactions') return getTransactions(url, env)
      return json({ error: 'not found' }, 404)
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500)
    }
  }
}

// ---------------------------------------------------------------- auth

function checkAuth(request, secret) {
  if (!secret) return false
  const h = request.headers.get('authorization') || ''
  return h === `Bearer ${secret}`
}

// ---------------------------------------------------------------- JWT

function b64url(bytesOrBuf) {
  const arr = bytesOrBuf instanceof Uint8Array ? bytesOrBuf : new Uint8Array(bytesOrBuf)
  let bin = ''
  for (let i = 0; i < arr.byteLength; i++) bin += String.fromCharCode(arr[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return buf
}

let cachedKey = null
async function getPrivateKey(env) {
  if (cachedKey) return cachedKey
  if (!env.APP_PRIVATE_KEY) throw new Error('APP_PRIVATE_KEY secret missing')
  cachedKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.APP_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return cachedKey
}

async function signJwt(env) {
  if (!env.APP_ID) throw new Error('APP_ID variable missing')
  const header = { alg: 'RS256', kid: env.APP_ID, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + 3600
  }
  const enc = new TextEncoder()
  const h = b64url(enc.encode(JSON.stringify(header)))
  const p = b64url(enc.encode(JSON.stringify(payload)))
  const key = await getPrivateKey(env)
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    enc.encode(`${h}.${p}`)
  )
  return `${h}.${p}.${b64url(sig)}`
}

async function eb(path, env, init = {}) {
  const jwt = await signJwt(env)
  const r = await fetch(`${EB_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`eb ${path} ${r.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

// ---------------------------------------------------------------- endpoints

async function listInstitutions(url, env) {
  const country = (url.searchParams.get('country') || 'FR').toUpperCase()
  const res = await eb(`/aspsps?country=${country}`, env)
  const list = res.aspsps || []
  return json(list.map(a => ({
    id: `${a.name}__${a.country}`,
    name: a.name,
    country: a.country,
    logo: a.logo
  })))
}

async function createLink(request, env) {
  const body = await request.json()
  if (!body.institution_id) return json({ error: 'institution_id required' }, 400)
  const parts = body.institution_id.split('__')
  if (parts.length !== 2) return json({ error: 'invalid institution_id' }, 400)
  const [name, country] = parts

  const validUntil = new Date(Date.now() + 180 * 86400 * 1000).toISOString()
  const state = crypto.randomUUID()

  const res = await eb('/auth', env, {
    method: 'POST',
    body: JSON.stringify({
      access: { valid_until: validUntil },
      aspsp: { name, country },
      psu_type: 'personal',
      redirect_url: body.redirect_url || env.PWA_URL,
      state
    })
  })

  await env.KV.put(`auth:${res.authorization_id}`, JSON.stringify({
    institution: { name, country },
    state,
    created_at: Date.now()
  }))

  return json({
    link: res.url,
    authorization_id: res.authorization_id,
    state
  })
}

async function createSession(request, env) {
  const { code } = await request.json()
  if (!code) return json({ error: 'code required' }, 400)

  const res = await eb('/sessions', env, {
    method: 'POST',
    body: JSON.stringify({ code })
  })

  const accounts = (res.accounts || []).map(normalizeAccount)
  await env.KV.put('current_session', JSON.stringify({
    session_id: res.session_id,
    raw_accounts: res.accounts,
    accounts,
    created_at: Date.now(),
    valid_until: res.access?.valid_until
  }))

  return json({
    session_id: res.session_id,
    valid_until: res.access?.valid_until,
    accounts
  })
}

async function listAccounts(env) {
  const stored = await env.KV.get('current_session')
  if (!stored) return json({ error: 'no session' }, 404)
  const { accounts } = JSON.parse(stored)
  return json(accounts)
}

async function getTransactions(url, env) {
  const accountId = url.searchParams.get('account_id')
  if (!accountId) return json({ error: 'account_id required' }, 400)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const qs = new URLSearchParams()
  if (from) qs.set('date_from', from)
  if (to) qs.set('date_to', to)
  const path = `/accounts/${accountId}/transactions${qs.toString() ? `?${qs}` : ''}`

  let next = path
  const out = []
  // EB paginates via continuation_key; loop until none.
  for (let guard = 0; next && guard < 20; guard++) {
    const page = await eb(next, env)
    for (const t of (page.transactions || [])) out.push(normalizeTx(t))
    if (page.continuation_key) {
      const sep = path.includes('?') ? '&' : '?'
      next = `${path}${sep}continuation_key=${encodeURIComponent(page.continuation_key)}`
    } else {
      next = null
    }
  }

  return json(out)
}

function normalizeAccount(a) {
  const id = a.uid
  const iban = (a.account_id && a.account_id.iban) || a.iban
  const name = a.name || a.product || a.cash_account_name || a.details
  return {
    id,
    iban,
    name,
    currency: a.currency
  }
}

function normalizeTx(t) {
  const amt = Number((t.transaction_amount && t.transaction_amount.amount) || 0)
  const sign = t.credit_debit_indicator === 'DBIT' ? -1 : 1
  const amount = sign * Math.abs(amt)
  const remit = Array.isArray(t.remittance_information)
    ? t.remittance_information.join(' ')
    : (t.remittance_information || '')
  const label = (
    remit ||
    (t.creditor && t.creditor.name) ||
    (t.debtor && t.debtor.name) ||
    t.additional_information ||
    t.bank_transaction_code ||
    ''
  ).toString().trim()
  const date = (t.booking_date || t.transaction_date || t.value_date || '').slice(0, 10)
  const id =
    t.transaction_id ||
    t.entry_reference ||
    `${date}|${label}|${amount.toFixed(2)}`
  return {
    id,
    date,
    label,
    amount,
    status: t.status || 'booked'
  }
}

// ---------------------------------------------------------------- helpers

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}
