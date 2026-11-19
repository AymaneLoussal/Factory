import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ordreService from '../api/ordreService';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Notice from '../components/common/Notice';

export default function Ordres() {
  const [ordres, setOrdres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancellation modal state
  const [cancellingOrdre, setCancellingOrdre] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrdres = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ordreService.getAll();
      setOrdres(data);
    } catch (err) {
      setError('Impossible de récupérer la liste des ordres de fabrication.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrdres();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancellingOrdre) return;
    setIsCancelling(true);
    try {
      await ordreService.annuler(cancellingOrdre._id);
      setCancellingOrdre(null);
      await loadOrdres();
    } catch (err) {
      alert(err.friendlyMessage || 'Impossible d\'annuler cet ordre.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredOrdres = useMemo(() => {
    return ordres.filter((o) => {
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const ref = (o.reference || '').toLowerCase();
      const prodName = (o.produit?.nom || o.produit?.reference || '').toLowerCase();

      return matchesStatus && (ref.includes(q) || prodName.includes(q));
    });
  }, [ordres, statusFilter, searchQuery]);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Ordres de fabrication</h1>
          <p>Supervisez le carnet de commandes, planifiez de nouvelles séries et suivez l'avancement.</p>
        </div>
        <div className="head-actions">
          <Link to="/ordres/nouveau" className="btn primary">
            <Icon name="plus" size={16} />
            Créer un ordre multi-produits
          </Link>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      {/* Toolbar filters */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="search" style={{ flex: 1, minWidth: 260 }}>
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Rechercher par référence d'ordre ou nom de produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'].map((st) => (
            <button
              key={st}
              type="button"
              className={`btn ${statusFilter === st ? 'primary' : ''}`}
              onClick={() => setStatusFilter(st)}
              style={{ minHeight: 38, fontSize: 12 }}
            >
              {st === 'ALL' ? `Tous (${ordres.length})` : st}
            </button>
          ))}
        </div>
      </div>

      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>RÉFÉRENCE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>PRODUIT CIBLE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>QUANTITÉ</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>STATUT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>PLANIFICATION</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>
                    <span className="spinner"></span> Chargement des ordres de fabrication...
                  </td>
                </tr>
              ) : filteredOrdres.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun ordre de fabrication trouvé.
                  </td>
                </tr>
              ) : (
                filteredOrdres.map((ordre) => (
                  <tr key={ordre._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                      <Link to={`/ordres/${ordre._id}`} style={{ color: 'var(--blue)' }}>
                        {ordre.reference}
                      </Link>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <strong>{ordre.produit?.nom || 'Produit'}</strong>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Réf: {ordre.produit?.reference}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <strong className="tabular" style={{ fontSize: 14 }}>
                        {ordre.quantite} unités
                      </strong>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <Badge status={ordre.status} />
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--slate)', fontSize: 13 }}>
                      {ordre.datePlanification
                        ? new Date(ordre.datePlanification).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <Link
                          to={`/ordres/${ordre._id}`}
                          className="btn"
                          style={{ minHeight: 32, padding: '4px 10px', fontSize: 11 }}
                        >
                          Détails
                        </Link>
                        {ordre.status === 'PLANIFIE' && (
                          <button
                            type="button"
                            className="btn"
                            style={{ minHeight: 32, padding: '4px 10px', fontSize: 11, color: 'var(--red-ink)' }}
                            onClick={() => setCancellingOrdre(ordre)}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal: Cancellation */}
      <Modal
        isOpen={Boolean(cancellingOrdre)}
        onClose={() => setCancellingOrdre(null)}
        title="Annuler l'ordre de fabrication"
        subtitle={`Êtes-vous certain de vouloir annuler l'ordre ${cancellingOrdre?.reference} ? Cette action est irréversible.`}
        iconName="alert"
        isDanger={true}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setCancellingOrdre(null)}
              disabled={isCancelling}
            >
              Conserver l'ordre
            </button>
            <button
              type="button"
              className="btn primary"
              style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
            </button>
          </>
        }
      />
    </div>
  );
}
