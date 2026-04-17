import { useEffect, useState } from 'react'
import { verifyCredential } from '../lock'

interface Props {
  credentialId: string
  onUnlock: () => void
}

export default function LockScreen({ credentialId, onUnlock }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const unlock = async () => {
    setBusy(true)
    setError(null)
    const ok = await verifyCredential(credentialId)
    setBusy(false)
    if (ok) onUnlock()
    else setError('Authentification refusée. Réessaie.')
  }

  useEffect(() => {
    // Try automatic unlock on mount (on iOS this still requires a user gesture
    // in some contexts, but we attempt it anyway for a smooth flow).
    unlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="lock-screen">
      <div className="lock-icon">🔒</div>
      <h2>Mon compte</h2>
      <p className="secondary">Déverrouille avec Face ID / Touch ID.</p>
      <button className="primary-btn" onClick={unlock} disabled={busy}>
        {busy ? 'Authentification…' : 'Déverrouiller'}
      </button>
      {error && <div className="lock-error">{error}</div>}
    </div>
  )
}
