import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import CategoryDetail from './pages/CategoryDetail'
import TransactionDetail from './pages/TransactionDetail'
import { useStore } from './store'

export default function App() {
  const { transactions, importFromText } = useStore()

  useEffect(() => {
    if (transactions.length > 0) return
    const url = `${import.meta.env.BASE_URL}sample.csv`
    fetch(url)
      .then(r => (r.ok ? r.text() : null))
      .then(text => { if (text) importFromText(text) })
      .catch(() => { /* ignore */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/category/:id" element={<CategoryDetail />} />
      <Route path="/transaction/:id" element={<TransactionDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
