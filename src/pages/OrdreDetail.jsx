import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ordreService from '../api/ordreService';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Notice from '../components/common/Notice';

export default function OrdreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isOperator } = useAuth();

  const [ordre, setOrdre] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Start / Cancel action states
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [stockRejection, setStockRejection] = useState(null);

  const loadOrdre = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ordreService.getById(id);
      setOrdre(data);
    } catch (err) {
      setError('Impossible de charger les informations de cet ordre.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrdre();
  }, [id]);

  const handleStartOrder = async () => {
    setIsStarting(true);
    setStockRejection(null);
    try {
      await ordreService.demarrer(id);
      await loadOrdre();
    } catch (err) {
      const msg = err.friendlyMessage || 'Impossible de lancer la production.';
      if (msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('insufficient')) {
        setStockRejection(msg);
      } else {
        alert(msg);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await ordreService.annuler(id);
      setIsCancelModalOpen(false);
      await loadOrdre();
    } catch (err) {
      alert(err.friendlyMessage || 'Impossible d\'annuler cet ordre.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="center-page">
        <div className="empty-state">
          <div className="empty-icon">
            <span className="spinner" style={{ width: 32, height: 32 }}></span>
          </div>
          <h2>Chargement de l'ordre...</h2>
        </div>
      </div>
    );
  }

  if (!ordre) {
    return (
      <div className="center-page">
        <div className="empty-state">
          <h2>Ordre introuvable</h2>
          <p className="muted">L'ordre demandé n'existe pas ou a été supprimé.</p>
          <Link to="/ordres" className="btn primary">
            Retour aux ordres
          </Link>
        </div>
      </div>
    );
  }

  const isPlanned = ordre.status === 'PLANIFIE';
  const isInProgress = ordre.status === 'EN_COURS';
  const isCompleted = ordre.status === 'TERMINE';

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/ordres" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <Icon name="left" size={16} />
          Retour à la liste des ordres
        </Link>
      </div>

      {/* Header Panel */}
      <header className="page-head" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28 }}>Ordre {ordre.reference}</h1>
            <Badge status={ordre.status} />
          </div>
          <p className="muted">
            Créé le {new Date(ordre.createdAt || Date.now()).toLocaleDateString('fr-FR')} · Produit cible :{' '}
            <strong>{ordre.produit?.nom || 'Produit'}</strong> ({ordre.quantite} unités)
          </p>
        </div>

        <div className="head-actions">
          {isPlanned && (
            <>
              <button
                type="button"
                className="btn"
                style={{ color: 'var(--red-ink)' }}
                onClick={() => setIsCancelModalOpen(true)}
              >
                Annuler l'ordre
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={handleStartOrder}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <span className="spinner"></span> Lancement...
                  </>
                ) : (
                  <>
                    <Icon name="play" size={16} />
                    Lancer la fabrication
                  </>
                )}
              </button>
            </>
          )}

          {isInProgress && (
            <Link to="/operator" className="btn primary">
              <Icon name="users" size={16} />
              Accéder à l'espace atelier
            </Link>
          )}
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      {/* Stock Rejection Banner */}
      {stockRejection && (
        <Notice
          tone="error"
          title="Lancement rejeté : Rupture de stock de matières premières"
          className="section-gap"
        >
          <p style={{ marginTop: 6 }}>{stockRejection}</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/lots" className="btn" style={{ minHeight: 32, padding: '4px 10px', fontSize: 11 }}>
              <Icon name="plus" size={14} />
              Réceptionner des lots en magasin
            </Link>
          </div>
        </Notice>
      )}

      {/* Lifecycle Progress Steps */}
      <div className="panel" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
        <div className="steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div className={`step ${isPlanned ? 'current' : 'done'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span className="step-circle" style={{ width: 28, height: 28, borderRadius: '50%', background: isPlanned ? 'var(--blue)' : 'var(--emerald)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 12 }}>
              {isPlanned ? '1' : '✓'}
            </span>
            <span>Planifié</span>
          </div>

          <div style={{ flex: 1, height: 2, background: isPlanned ? '#e2e8f0' : 'var(--emerald)', maxWidth: 120 }}></div>

          <div className={`step ${isInProgress ? 'current' : isCompleted ? 'done' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: isInProgress || isCompleted ? 'var(--navy)' : 'var(--muted)' }}>
            <span className="step-circle" style={{ width: 28, height: 28, borderRadius: '50%', background: isInProgress ? 'var(--amber)' : isCompleted ? 'var(--emerald)' : '#e2e8f0', color: isInProgress || isCompleted ? 'white' : 'var(--muted)', display: 'grid', placeItems: 'center', fontSize: 12 }}>
              {isCompleted ? '✓' : '2'}
            </span>
            <span>En fabrication</span>
          </div>

          <div style={{ flex: 1, height: 2, background: isCompleted ? 'var(--emerald)' : '#e2e8f0', maxWidth: 120 }}></div>

          <div className={`step ${isCompleted ? 'current' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: isCompleted ? 'var(--navy)' : 'var(--muted)' }}>
            <span className="step-circle" style={{ width: 28, height: 28, borderRadius: '50%', background: isCompleted ? 'var(--emerald)' : '#e2e8f0', color: isCompleted ? 'white' : 'var(--muted)', display: 'grid', placeItems: 'center', fontSize: 12 }}>
              3
            </span>
            <span>Terminé</span>
          </div>
        </div>
      </div>

      {/* Snapshot of Composition Lines */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
        <div className="panel-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Instantané figé de la composition (Snapshot d'ordre)</h2>
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Matières premières et quantités calculées lors de la commande (inaltérables par les modifications de BOM ultérieures).
            </p>
          </div>
          <Icon name="shield" size={20} style={{ color: 'var(--blue)' }} />
        </div>

        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>MATIÈRE PREMIÈRE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>RATIO UNITAIRE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>QUANTITÉ TOTALE DEMANDÉE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>CONSOMMATION EFFECTIVE</th>
              </tr>
            </thead>
            <tbody>
              {!ordre.lignes || ordre.lignes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucune ligne de composition capturée pour cet ordre.
                  </td>
                </tr>
              ) : (
                ordre.lignes.map((line, idx) => (
                  <tr key={line._id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <strong>{line.matiere?.nom || 'Matière'}</strong>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Réf: {line.matiere?.reference}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--slate)' }}>
                      {line.quantiteUnitaire} {line.unite} / unité
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <strong className="tabular" style={{ fontSize: 15, color: 'var(--navy)' }}>
                        {line.quantiteDemandee} {line.unite}
                      </strong>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <strong
                        className="tabular"
                        style={{
                          fontSize: 14,
                          color: line.quantiteConsommee > 0 ? 'var(--green-ink)' : 'var(--muted)',
                        }}
                      >
                        {line.quantiteConsommee} {line.unite}
                      </strong>
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
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirmer l'annulation de l'ordre"
        subtitle={`Voulez-vous vraiment annuler l'ordre ${ordre.reference} ?`}
        iconName="alert"
        isDanger={true}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Non, conserver
            </button>
            <button
              type="button"
              className="btn primary"
              style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? 'Annulation...' : 'Oui, annuler l\'ordre'}
            </button>
          </>
        }
      />
    </div>
  );
}
