import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
  // Hide bottom tab bar on drill-down screens so they feel modal / detailed.
  if (location.pathname.startsWith('/category/') || location.pathname.startsWith('/transaction/')) {
    return null
  }
  return <TabBar />
}
