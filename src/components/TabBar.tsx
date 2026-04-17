import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { IconWallet, IconPie, IconRepeat, IconSettings } from '../icons'

const tabs: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/', label: 'Compte', icon: IconWallet },
  { to: '/analyse', label: 'Analyse', icon: IconPie },
  { to: '/abonnements', label: 'Abos', icon: IconRepeat },
  { to: '/reglages', label: 'Réglages', icon: IconSettings }
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
        >
          <Icon size={22} strokeWidth={2} className="tab-icon" />
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
