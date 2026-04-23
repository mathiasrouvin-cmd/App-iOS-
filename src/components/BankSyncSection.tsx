import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import {
  createLink, createSession, fetchAccounts, fetchTransactions, listInstitutions, ping,
  rawToTransaction, type Institution
} from '../sync'
import { IconAlert, IconRepeat, IconUpload, IconChevron } from '../icons'

type Stage = 'idle' | 'testing' | 'picking' | 'linking' | 'exchanging' | 'syncing'

export default function BankSyncSection() {
  const {
    settings, setSyncBackend, setSyncLinked, setSyncAccounts,
    markSynced, disconnectSync, ingestTransactions
  } = useStore()

  const [url, setUrl] = useState(settings.sync.backendUrl)
  const [token, setToken] = useState(settings.sync.authToken)
  const [stage, setStage] = useState<Stage>('idle')
  const [connOk, setConnOk] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [filter, setFilter] = useState('')
  const [lastSyncAdded, setLastSyncAdded] = useState<number | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const cfg = useMemo(() => ({ backendUrl: url, authToken: token }), [url, token])
  const configured = url.trim().length > 0 && token.trim().length > 0
  const linked = settings.sync.accounts.length > 0

  const persist = () => setSyncBackend(url, token)

  useEffect(() => {
    const code = sessionStorage.getItem('banking:code')
    if (!code || !configured) return
    sessionStorage.removeItem('banking:code')
    sessionStorage.removeItem('banking:state')
    void exchangeCode(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  const exchangeCode = async (code: string) => {
    setStage('exchanging')
    setError(null)
    try {
      const res = await createSession(cfg, code)
      setSyncLinked(
        settings.sync.institutionId || 'unknown',
        res.session_id,
        res.accounts
      )
      setInfo(`Compte lié : ${res.accounts.length} compte(s).`)
    } catch (e) {
      setError(errorString(e))
    }
    setStage('idle')
  }

  const test = async () => {
    persist()
    setStage('testing')
    setError(null)
    try {
      const ok = await ping(cfg)
      setConnOk(ok)
      if (!ok) setError('Le worker répond mais refuse le jeton.')
    } catch (e) {
      setConnOk(false)
      setError(errorString(e))
    }
    setStage('idle')
  }

  const startLink = async () => {
    persist()
    setStage('picking')
    setError(null)
    try {
      const list = await listInstitutions(cfg)
      setInstitutions(list)
    } catch (e) {
      setError(errorString(e))
      setStage('idle')
    }
  }

  const pickInstitution = async (inst: Institution) => {
    try {
      setStage('linking')
      const { link, authorization_id } = await createLink(cfg, inst.id)
      setSyncLinked(inst.id, authorization_id, [])
      window.location.href = link
    } catch (e) {
      setError(errorString(e))
      setStage('idle')
    }
  }

  const sync = async () => {
    setStage('syncing')
    setError(null)
    setLastSyncAdded(null)
    try {
      let accounts = settings.sync.accounts
      if (accounts.length === 0) {
        accounts = await fetchAccounts(cfg)
        setSyncAccounts(accounts)
      }
      const since = settings.sync.lastSync
        ? settings.sync.lastSync.slice(0, 10)
        : undefined
      let totalAdded = 0
      const rules = settings.rules
      for (const acc of accounts) {
        const raws = await fetchTransactions(cfg, acc.id, since)
        const txs = raws.map(r => rawToTransaction(r, rules))
        const { added } = ingestTransactions(txs)
        totalAdded += added
      }
      markSynced(new Date().toISOString())
      setLastSyncAdded(totalAdded)
    } catch (e) {
      setError(errorString(e))
    }
    setStage('idle')
  }

  const filteredInsts = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q
      ? institutions.filter(i => i.name.toLowerCase().includes(q))
      : institutions
  }, [institutions, filter])

  // -------------------------------------------------------- render variants

  const SetupInputs = (
    <>
      <div className="field" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
        <span className="k">URL du worker</span>
        <input
          type="url"
          placeholder="https://banking-sync.xxx.workers.dev"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onBlur={persist}
          className="rule-input"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div className="field" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
        <span className="k">Jeton d'auth (APP_SECRET)</span>
        <input
          type="password"
          placeholder="••••••••••"
          value={token}
          onChange={e => setToken(e.target.value)}
          onBlur={persist}
          className="rule-input"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div className="field">
        <span className="k">Connexion</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {connOk === true && <span className="amount-pos">OK</span>}
          {connOk === false && <span className="amount-neg">Échec</span>}
          <button onClick={test} disabled={!configured || stage === 'testing'}>
            {stage === 'testing' ? 'Test…' : 'Tester'}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="section-title">Synchronisation banque</div>

      <div className="field-group">
        {linked ? (
          <>
            <div className="field" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <span className="k">Statut</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="v">
                  <span className="amount-pos">●</span>{' '}
                  Banque liée · {settings.sync.accounts.length} compte
                  {settings.sync.accounts.length > 1 ? 's' : ''}
                </span>
              </div>
              {settings.sync.lastSync && (
                <span className="secondary" style={{ fontSize: 13 }}>
                  Dernière synchro&nbsp;:&nbsp;
                  {new Date(settings.sync.lastSync).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              )}
            </div>

            <button
              className="field"
              style={{ color: 'var(--accent)', fontWeight: 600, justifyContent: 'center' }}
              onClick={sync}
              disabled={stage === 'syncing'}
            >
              <IconRepeat size={16} strokeWidth={2.4} style={{ marginRight: 8 }} />
              {stage === 'syncing' ? 'Synchronisation…' : 'Synchroniser maintenant'}
            </button>

            <button
              className="field"
              style={{ justifyContent: 'space-between', color: 'var(--text-secondary)' }}
              onClick={() => setShowAdvanced(v => !v)}
            >
              <span>Réglages avancés</span>
              <IconChevron
                size={16}
                strokeWidth={2.4}
                style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
              />
            </button>

            {showAdvanced && (
              <>
                {SetupInputs}
                <button
                  className="field danger"
                  style={{ fontWeight: 500 }}
                  onClick={() => {
                    if (confirm('Délier la banque ? (Les transactions déjà importées restent.)')) {
                      disconnectSync()
                      setLastSyncAdded(null)
                      setInfo(null)
                    }
                  }}
                >
                  Délier la banque
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {SetupInputs}
            <button
              className="field"
              style={{ color: 'var(--accent)', fontWeight: 600, justifyContent: 'center' }}
              onClick={startLink}
              disabled={!configured || stage !== 'idle'}
            >
              <IconUpload size={16} strokeWidth={2.2} style={{ marginRight: 8 }} />
              {stage === 'exchanging' ? 'Finalisation…' : 'Lier une banque'}
            </button>
          </>
        )}

        {info && (
          <div className="field">
            <span className="secondary" style={{ fontSize: 13 }}>{info}</span>
          </div>
        )}
        {lastSyncAdded !== null && (
          <div className="field">
            <span className="secondary" style={{ fontSize: 13 }}>
              {lastSyncAdded === 0
                ? 'Aucune nouvelle transaction.'
                : `${lastSyncAdded} nouvelle(s) transaction(s) ajoutée(s).`}
            </span>
          </div>
        )}
        {error && (
          <div className="field">
            <span
              className="danger"
              style={{
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'normal',
                textAlign: 'left'
              }}
            >
              <IconAlert size={16} strokeWidth={2.2} />
              {error}
            </span>
          </div>
        )}
      </div>

      {!linked && (
        <div className="section-hint">
          Worker Cloudflare + Enable Banking. Voir <code>worker/README.md</code>
          pour le déploiement.
        </div>
      )}

      {stage === 'picking' && (
        <div className="inst-overlay" onClick={() => setStage('idle')}>
          <div className="inst-sheet" onClick={e => e.stopPropagation()}>
            <div className="inst-header">
              <span>Choisis ta banque</span>
              <button onClick={() => setStage('idle')}>Annuler</button>
            </div>
            <input
              type="search"
              placeholder="Rechercher…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="rule-input"
              style={{ width: '100%', marginBottom: 8 }}
              autoFocus
            />
            <div className="inst-list">
              {filteredInsts.map(inst => (
                <button
                  key={inst.id}
                  className="inst-row"
                  onClick={() => pickInstitution(inst)}
                >
                  {inst.logo
                    ? <img src={inst.logo} alt="" className="inst-logo" />
                    : <span className="inst-logo inst-logo-placeholder" />
                  }
                  <span>{inst.name}</span>
                </button>
              ))}
              {filteredInsts.length === 0 && institutions.length === 0 && (
                <div className="empty" style={{ padding: 20 }}>Chargement…</div>
              )}
              {filteredInsts.length === 0 && institutions.length > 0 && (
                <div className="empty" style={{ padding: 20 }}>Aucun résultat.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function errorString(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
