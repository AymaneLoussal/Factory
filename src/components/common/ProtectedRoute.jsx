import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Icon from './Icon';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="center-page" style={{ minHeight: '100vh' }}>
        <div className="empty-state">
          <div className="empty-icon">
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }}></span>
          </div>
          <h2>Chargement de la session...</h2>
          <p className="muted">Vérification de vos droits d'accès à FactoryFlow.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'OPERATEUR') {
      return <Navigate to="/operator" replace />;
    }
    if (role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <div className="center-page" style={{ minHeight: '80vh' }}>
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
            <Icon name="shield" size={32} />
          </div>
          <h2>Accès non autorisé (403)</h2>
          <p className="muted">
            Votre compte possède le rôle <strong>{role}</strong>, qui ne dispose pas des privilèges nécessaires pour accéder à cette vue.
          </p>
          <button className="btn primary" onClick={() => window.history.back()}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return children;
}
