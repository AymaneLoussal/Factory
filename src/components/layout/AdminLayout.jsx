import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Icon from '../common/Icon';
import Badge from '../common/Badge';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Tableau de bord';
    if (path.startsWith('/matieres')) return 'Matières premières';
    if (path.startsWith('/lots')) return 'Lots et Stocks';
    if (path.startsWith('/mouvements')) return 'Historique des mouvements';
    if (path.startsWith('/produits')) return 'Catalogue Produits';
    if (path.startsWith('/compositions')) return 'Nomenclatures (BOM)';
    if (path.startsWith('/ordres/nouveau')) return 'Nouvel Ordre de fabrication';
    if (path.startsWith('/ordres')) return 'Ordres de fabrication';
    if (path.startsWith('/operator')) return 'Espace Opérateur';
    return 'Production';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Vue générale', icon: 'grid' },
    { to: '/matieres', label: 'Matières premières', icon: 'layers' },
    { to: '/lots', label: 'Lots de stock', icon: 'box' },
    { to: '/mouvements', label: 'Historique mouvements', icon: 'history' },
    { to: '/produits', label: 'Catalogue produits', icon: 'box' },
    { to: '/compositions', label: 'Nomenclatures (BOM)', icon: 'file' },
    { to: '/ordres', label: 'Ordres de fabrication', icon: 'clipboard' },
  ];

  return (
    <div>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="modal"
          style={{ zIndex: 30, background: '#0f172a80' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={mobileMenuOpen ? 'sidebar open' : 'sidebar'}
        style={{
          transform: mobileMenuOpen ? 'translateX(0)' : undefined,
          display: mobileMenuOpen ? 'flex' : undefined,
          zIndex: mobileMenuOpen ? 31 : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
          <NavLink to="/dashboard" className="brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="brandmark">
              <Icon name="factory" size={24} />
            </span>
            FactoryFlow
          </NavLink>
          {mobileMenuOpen && (
            <button
              type="button"
              className="icon-button"
              style={{ background: 'transparent', color: '#cbd5e1', border: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        <div className="workspace-label">GESTION INDUSTRIELLE</div>

        <nav className="nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon name={link.icon} size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="workspace-label" style={{ marginTop: 24 }}>ATELIER</div>
        <nav className="nav">
          <NavLink
            to="/operator"
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon name="users" size={18} />
            <span>Vue Opérateur</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="plant">
            <span className="dot"></span>
            <strong>Usine YouCode Safi</strong>
            <p>Atelier A · Ligne principale</p>
          </div>

          <div className="profile">
            <div className="avatar">
              {user?.nom ? user.nom.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nom || 'Administrateur'}
              </strong>
              <small>{user?.role || 'ADMIN'}</small>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="app">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              className="icon-button mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={mobileMenuOpen}
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="breadcrumb">
              <span>FactoryFlow</span>
              <span style={{ opacity: 0.5 }}>/</span>
              <strong>{getBreadcrumb()}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <Badge status={user?.role || 'ADMIN'} />
            <time className="tabular" style={{ fontSize: 12, color: 'var(--muted)' }}>
              Mercredi 18 nov. 2026
            </time>
          </div>
        </header>

        <main className="content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
