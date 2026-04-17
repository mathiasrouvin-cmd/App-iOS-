import { useState } from 'react'
import { useStore } from '../store'
import { CATEGORIES, type CategoryId } from '../types'
import { isWebAuthnSupported, registerCredential } from '../lock'
import { IconAdd, IconFingerprint, IconTrash } from '../icons'

export default function Settings() {
  const {
    settings, addRule, deleteRule, setBudget, reclassifyAll,
    enableLock, disableLock, reset
  } = useStore()

  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState<CategoryId>('subscriptions')
  const [toast, setToast] = useState<string | null>(null)
  const [lockError, setLockError] = useState<string | null>(null)

  const submitRule = () => {
    const kw = newKeyword.trim()
    if (!kw) return
    addRule(kw, newCategory)
    setNewKeyword('')
    setToast(`Règle ajoutée. Touche « Reclasser tout » pour l'appliquer.`)
    setTimeout(() => setToast(null), 2500)
  }

  const reclassify = () => {
    const changed = reclassifyAll()
    setToast(changed === 0 ? 'Aucun changement' : `${changed} transaction(s) reclassée(s)`)
    setTimeout(() => setToast(null), 2500)
  }

  const setupLock = async () => {
    setLockError(null)
    try {
      const credId = await registerCredential()
      enableLock(credId)
      setToast('Verrouillage activé')
      setTimeout(() => setToast(null), 2000)
    } catch (e) {
      setLockError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="screen with-tabbar">
      <div className="nav">
        <span className="nav-btn" />
        <h1>Réglages</h1>
        <span className="nav-btn right" />
      </div>

      <div className="container">
        <div className="section-title">Sécurité</div>
        <div className="field-group">
          <div className="field">
            <span className="k" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconFingerprint size={18} strokeWidth={2} />
              Verrouillage biométrique
            </span>
            {settings.lockEnabled ? (
              <button className="danger" onClick={() => disableLock()}>Désactiver</button>
            ) : (
              <button onClick={setupLock} disabled={!isWebAuthnSupported()}>
                {isWebAuthnSupported() ? 'Activer' : 'Non disponible'}
              </button>
            )}
          </div>
          {lockError && (
            <div className="field">
              <span className="danger" style={{ fontSize: 13 }}>{lockError}</span>
            </div>
          )}
        </div>

        <div className="section-title">Budgets mensuels</div>
        <div className="field-group">
          {CATEGORIES.filter(c => c.id !== 'income' && c.id !== 'transfers').map(c => {
            const Icon = c.icon
            return (
              <div className="field" key={c.id}>
                <span className="k" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className="icon-tile circle"
                    style={{ background: c.color, width: 28, height: 28 }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                  {c.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="10"
                    value={settings.budgets[c.id] ?? ''}
                    onChange={e => {
                      const v = e.target.value
                      setBudget(c.id, v === '' ? null : Number(v))
                    }}
                    placeholder="—"
                    className="budget-input"
                  />
                  <span className="secondary">€</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="section-hint">
          Laisse vide pour pas de limite. Progression affichée sur l'accueil (sauf vue « Tout »).
        </div>

        <div className="section-title">Règles personnalisées</div>
        <div className="field-group">
          <div className="rule-editor">
            <input
              type="text"
              placeholder="mot-clé (ex: auchan)"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              className="rule-input"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as CategoryId)}
              className="rule-select"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button onClick={submitRule} className="rule-add-btn" aria-label="Ajouter">
              <IconAdd size={18} strokeWidth={2.6} />
            </button>
          </div>
          {settings.rules.length === 0 && (
            <div className="field"><span className="secondary">Aucune règle.</span></div>
          )}
          {settings.rules.map(r => {
            const meta = CATEGORIES.find(c => c.id === r.category)
            const Icon = meta?.icon
            return (
              <div className="field" key={r.id}>
                <span className="k" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {Icon && (
                    <span
                      className="icon-tile circle"
                      style={{ background: meta!.color, width: 26, height: 26 }}
                    >
                      <Icon size={12} strokeWidth={2.4} />
                    </span>
                  )}
                  <span><b>{r.keyword}</b> → {meta?.label}</span>
                </span>
                <button
                  className="danger"
                  onClick={() => deleteRule(r.id)}
                  aria-label="Supprimer"
                >
                  <IconTrash size={16} strokeWidth={2} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="section-title">Actions</div>
        <div className="field-group">
          <button
            className="field"
            style={{ color: 'var(--accent)', fontWeight: 500 }}
            onClick={reclassify}
          >
            Reclasser toutes les transactions
          </button>
          <button
            className="field danger"
            style={{ fontWeight: 500 }}
            onClick={() => {
              if (confirm('Supprimer toutes les transactions ?')) reset()
            }}
          >
            Effacer toutes les transactions
          </button>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  )
}
