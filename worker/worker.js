// Cloudflare Worker — GoCardless Bank Account Data bridge for BankingApp PWA.
// Deploy via Cloudflare dashboard: Workers & Pages > Create > Paste this code.
//
// Required bindings (set in dashboard > Worker > Settings):
//   - Secret: GOCARDLESS_SECRET_ID   (from bankaccountdata.gocardless.com)
//   - Secret: GOCARDLESS_SECRET_KEY
//   - Secret: APP_SECRET             (any long random string; paste same value in PWA)
//   - Variable: PWA_URL              (your PWA URL, e.g. https://app-ios.pages.dev/)
//   - KV binding: KV                 (create a KV namespace, bind it as "KV")
//
// The PWA talks to this worker with `Authorization: Bearer <APP_SECRET>`.
// The worker proxies requests to GoCardless using its own stored token.

const GC_BASE = 'https://bankaccountdata.gocardless.com/api/v2'

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

    // The /api/callback route is hit by the user's browser after bank
    // consent — it has no auth header, redirect straight to the PWA.
    if (url.pathname === '/api/callback') {
      return handleCallback(url, env)
    }

    if (!checkAuth(request, env.APP_SECRET)) {
      return json({ error: 'unauthorized' }, 401)
    }

    try {
      if (url.pathname === '/api/institutions') return listInstitutions(url, env)
      if (url.pathname === '/api/link' && request.method === 'POST') return createLink(request, env)
      if (url.pathname === '/api/requisition') return getRequisition(url, env)
      if (url.pathname === '/api/accounts') return getAccounts(url, env)
      if (url.pathname === '/api/transactions') return getTransactions(url, env)
      if (url.pathname === '/api/ping') return json({ ok: true })
      return json({ error: 'not found' }, 404)
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500)
    }
  }
}

// -------------------------------------------------------------- auth/token

function checkAuth(request, secret) {
  if (!secret) return false
  const h = request.headers.get('authorization') || ''
  return h === `Bearer ${secret}`
}

async function getAccessToken(env) {
  const cached = await env.KV.get('gc_access_token')
  if (cached) return cached

  const r = await fetch(`${GC_BASE}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      secret_id: env.GOCARDLESS_SECRET_ID,
      secret_key: env.GOCARDLESS_SECRET_KEY
    })
  })
  if (!r.ok) throw new Error(`gc token ${r.status}: ${await r.text()}`)
  const d = await r.json()
  const ttl = Math.max(60, (d.access_expires || 86400) - 60)
  await env.KV.put('gc_access_token', d.access, { expirationTtl: ttl })
  return d.access
}

async function gc(path, env, init = {}) {
  const token = await getAccessToken(env)
  const r = await fetch(`${GC_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
  if (!r.ok) throw new Error(`gc ${path} ${r.status}: ${await r.text()}`)
  return r.json()
}

// -------------------------------------------------------------- endpoints

async function listInstitutions(url, env) {
  const country = (url.searchParams.get('country') || 'FR').toUpperCase()
  const list = await gc(`/institutions/?country=${country}`, env)
  return json(list.map(i => ({ id: i.id, name: i.name, logo: i.logo })))
}

async function createLink(request, env) {
  const body = await request.json()
  const institution_id = body.institution_id
  if (!institution_id) return json({ error: 'institution_id required' }, 400)

  const callbackUrl = new URL(request.url).origin + '/api/callback'

  const agreement = await gc('/agreements/enduser/', env, {
    method: 'POST',
    body: JSON.stringify({
      institution_id,
      max_historical_days: body.historical_days || 90,
      access_valid_for_days: body.valid_days || 90,
      access_scope: ['balances', 'details', 'transactions']
    })
  })

  const requisition = await gc('/requisitions/', env, {
    method: 'POST',
    body: JSON.stringify({
      redirect: callbackUrl,
      institution_id,
      agreement: agreement.id,
      reference: crypto.randomUUID(),
      user_language: 'FR'
    })
  })

  await env.KV.put(
    `req:${requisition.id}`,
    JSON.stringify({
      institution_id,
      status: requisition.status,
      created_at: Date.now()
    })
  )
  await env.KV.put('current_req_id', requisition.id)

  return json({
    link: requisition.link,
    requisition_id: requisition.id
  })
}

async function getRequisition(url, env) {
  const id = url.searchParams.get('id') || (await env.KV.get('current_req_id'))
  if (!id) return json({ error: 'no requisition' }, 404)
  const req = await gc(`/requisitions/${id}/`, env)
  return json({
    id: req.id,
    status: req.status, // CR, LN, EX, SU, RJ…
    accounts: req.accounts,
    institution_id: req.institution_id
  })
}

async function getAccounts(url, env) {
  const id = url.searchParams.get('id') || (await env.KV.get('current_req_id'))
  if (!id) return json({ error: 'no requisition' }, 404)
  const req = await gc(`/requisitions/${id}/`, env)
  if (req.status !== 'LN') {
    return json({ error: 'not linked', status: req.status }, 400)
  }

  const out = []
  for (const accId of req.accounts || []) {
    try {
      const [details, balances] = await Promise.all([
        gc(`/accounts/${accId}/details/`, env).catch(() => null),
        gc(`/accounts/${accId}/balances/`, env).catch(() => null)
      ])
      out.push({
        id: accId,
        iban: details && details.account && details.account.iban,
        name: details && details.account && (details.account.name || details.account.ownerName),
        currency: details && details.account && details.account.currency,
        balance: balances && balances.balances && balances.balances[0]
          && balances.balances[0].balanceAmount
          && balances.balances[0].balanceAmount.amount
      })
    } catch {
      out.push({ id: accId })
    }
  }
  return json(out)
}

async function getTransactions(url, env) {
  const accountId = url.searchParams.get('account_id')
  if (!accountId) return json({ error: 'account_id required' }, 400)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const qs = new URLSearchParams()
  if (from) qs.set('date_from', from)
  if (to) qs.set('date_to', to)

  const data = await gc(
    `/accounts/${accountId}/transactions/${qs.toString() ? `?${qs}` : ''}`,
    env
  )

  const normalize = (t, status) => {
    const amount = Number((t.transactionAmount && t.transactionAmount.amount) || 0)
    const label = (
      t.remittanceInformationUnstructured ||
      (Array.isArray(t.remittanceInformationUnstructuredArray)
        ? t.remittanceInformationUnstructuredArray.join(' ')
        : '') ||
      t.creditorName ||
      t.debtorName ||
      ''
    ).trim()
    const date = t.bookingDate || t.valueDate || ''
    const id =
      t.transactionId ||
      t.internalTransactionId ||
      `${date}|${label}|${amount.toFixed(2)}`
    return { id, date, label, amount, status }
  }

  const booked = (data.transactions && data.transactions.booked) || []
  const pending = (data.transactions && data.transactions.pending) || []

  const txs = [
    ...booked.map(t => normalize(t, 'booked')),
    ...pending.map(t => normalize(t, 'pending'))
  ]

  return json(txs)
}

async function handleCallback(url, env) {
  // Called by the user's browser after bank consent. We don't know which
  // requisition they came from (GoCardless doesn't pass the id on their
  // default redirect unless added to the URL), but we stored the id before
  // redirecting the user out, so we can just bounce back to the PWA.
  const pwa = (env.PWA_URL || '/').replace(/\/$/, '')
  return Response.redirect(`${pwa}/#/link-callback?ok=1`, 302)
}

// -------------------------------------------------------------- helpers

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}
