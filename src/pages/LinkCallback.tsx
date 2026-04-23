import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LinkCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Tell the Settings section to finalize the linking.
    window.dispatchEvent(new Event('banking:linked'))
    navigate('/reglages', { replace: true })
  }, [navigate])

  return (
    <div className="screen">
      <div className="nav">
        <span className="nav-btn" />
        <h1>Retour de la banque…</h1>
        <span className="nav-btn right" />
      </div>
      <div className="container">
        <div className="card empty">Finalisation de la liaison…</div>
      </div>
    </div>
  )
}
