import { NavLink } from 'react-router-dom'

const tabs: Array<{ to: string; label: string; icon: string }> = [
  { to: '/', label: 'Compte', icon: '🏠' },
  { to: '/analyse', label: 'Analyse', icon: '📊' },
  { to: '/abonnements', label: 'Abos', icon: '🔁' },
  { to: '/reglages', label: 'Réglages', icon: '⚙️' }
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
        >
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
