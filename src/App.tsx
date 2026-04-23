import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import Subscriptions from './pages/Subscriptions'
import Settings from './pages/Settings'
import CategoryDetail from './pages/CategoryDetail'
import TransactionDetail from './pages/TransactionDetail'
import LinkCallback from './pages/LinkCallback'
import TabBar from './components/TabBar'
import LockScreen from './components/LockScreen'
import { useStore } from './store'

export default function App() {
  const { transactions, settings, importFromText } = useStore()
  const [unlocked, setUnlocked] = useState<boolean>(!settings.lockEnabled)
  const navigate = useNavigate()

  useEffect(() => {
    if (!settings.lockEnabled) setUnlocked(true)
  }, [settings.lockEnabled])

  useEffect(() => {
    if (transactions.length > 0) return
    const url = `${import.meta.env.BASE_URL}sample.csv`
    fetch(url)
      .then(r => (r.ok ? r.text() : null))
      .then(text => { if (text) importFromText(text) })
      .catch(() => { /* ignore */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Enable Banking redirects back here with ?code=XXX&state=YYY after the
  // user finishes the bank consent flow. Hand the code to the sync section
  // and clear it from the URL so a refresh doesn't replay the exchange.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    if (!code) return
    sessionStorage.setItem('banking:code', code)
    if (state) sessionStorage.setItem('banking:state', state)
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.hash
    )
    navigate('/reglages', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (settings.lockEnabled && settings.credentialId && !unlocked) {
    return (
      <LockScreen
        credentialId={settings.credentialId}
        onUnlock={() => setUnlocked(true)}
      />
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyse" element={<Analytics />} />
        <Route path="/abonnements" element={<Subscriptions />} />
        <Route path="/reglages" element={<Settings />} />
        <Route path="/link-callback" element={<LinkCallback />} />
        <Route path="/category/:id" element={<CategoryDetail />} />
        <Route path="/transaction/:id" element={<TransactionDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBarGate />
    </>
  )
}

function TabBarGate() {
  const location = useLocation()
  if (location.pathname.startsWith('/category/') || location.pathname.startsWith('/transaction/')) {
    return null
  }
  return <TabBar />
}
