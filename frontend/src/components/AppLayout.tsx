import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, ClipboardCheck, Clock3, LayoutDashboard, Ticket, TicketCheck } from 'lucide-react';
import { api } from '../services/api';

const navigation = [
  { to: '/', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/validation', label: 'Contrôle des billets', icon: ClipboardCheck, end: false },
  { to: '/lists', label: 'Listes de billets', icon: Ticket, end: false },
  { to: '/history', label: 'Historique', icon: Clock3, end: false },
];

export function AppLayout() {
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const currentPage = navigation.find((item) => item.to === location.pathname)?.label ?? 'Billetterie';

  useEffect(() => {
    api.get('/health')
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand-lockup" aria-label="Ticket Control, accueil">
          <span className="brand-mark"><TicketCheck size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">ticket<span>control</span></span>
        </NavLink>

        <div className="sidebar-caption">ESPACE ÉVÉNEMENT</div>
        <div className="event-chip">
          <span className="event-chip-mark">S</span>
          <span><strong>Soirée événement</strong><small>Contrôle des accès</small></span>
        </div>

        <nav className="primary-nav" aria-label="Navigation principale">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {to === '/validation' && <span className="nav-live-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className={`connection-indicator${apiOnline ? ' online' : apiOnline === false ? ' offline' : ''}`} />
          <span>{apiOnline ? 'API connectée' : apiOnline === false ? 'API hors ligne' : 'Connexion…'}</span>
          <Activity size={15} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Événement</span><span className="breadcrumb-slash">/</span><strong>{currentPage}</strong></div>
          <div className="topbar-meta"><span className="topbar-date">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(new Date())}</span><span className="operator-badge">A</span></div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}