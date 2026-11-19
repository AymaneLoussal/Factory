import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

export default function NotFound() {
  return (
    <div className="center-page" style={{ minHeight: '80vh' }}>
      <div className="empty-state">
        <div className="error-code">404</div>
        <h2>Page introuvable</h2>
        <p className="muted">La vue que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link to="/dashboard" className="btn primary">
          <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
