import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Icon from '../common/Icon';
import Badge from '../common/Badge';

export default function OperatorLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header
        style={{
          background: 'var(--navy)',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="brand" style={{ color: 'white' }}>
            <span className="brandmark">
              <Icon name="factory" size={24} />
            </span>
            FactoryFlow
          </div>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', letterSpacing: 0.5 }}>
            ESPACE ATELIER & FABRICATION
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAdmin && (
            <Link to="/dashboard" className="btn" style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', minHeight: 36, padding: '6px 12px', fontSize: 12 }}>
              <Icon name="grid" size={16} />
              Retour Admin
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
              {user?.nom ? user.nom.slice(0, 2).toUpperCase() : 'OP'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.nom || 'Opérateur'}</span>
              <small style={{ color: '#94a3b8', fontSize: 10 }}>Ligne de fabrication</small>
            </div>
          </div>

          <Badge status="OPERATEUR" />

          <button
            type="button"
            className="btn"
            style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', minHeight: 36, padding: '6px 12px', fontSize: 12 }}
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <Icon name="logout" size={16} />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="content" style={{ maxWidth: 1200, padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
