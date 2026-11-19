import React, { useState, useEffect, useMemo } from 'react';
import ordreService from '../api/ordreService';
import useAuth from '../hooks/useAuth';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Notice from '../components/common/Notice';

export default function OperatorDashboard() {
  const { user } = useAuth();

  const [ordres, setOrdres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal actions
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [launchingOrder, setLaunchingOrder] = useState(null);
  const [finishingOrder, setFinishingOrder] = useState(null);
  const [stockRejectionNotice, setStockRejectionNotice] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ordreService.getAll();
      setOrdres(data);
    } catch (err) {
      setError(err.response?.status === 403
        ? "Le serveur ne permet pas encore aux opérateurs de consulter leurs ordres affectés."
        : (err.friendlyMessage || "Impossible de synchroniser les ordres de fabrication de l'atelier."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const { plannedOrders, inProgressOrders, completedOrders } = useMemo(() => {
    const planned = [];
    const inProgress = [];
    const completed = [];

    ordres.forEach((o) => {
      if (o.status === 'PLANIFIE') planned.push(o);
      else if (o.status === 'EN_COURS') inProgress.push(o);
      else if (o.status === 'TERMINE') completed.push(o);
    });

    return {
      plannedOrders: planned,
      inProgressOrders: inProgress,
      completedOrders: completed,
    };
  }, [ordres]);

  const handleLaunchOrder = async () => {
    if (!launchingOrder) return;
    setIsActionLoading(true);
    setStockRejectionNotice(null);

    try {
      await ordreService.demarrer(launchingOrder._id);
      setLaunchingOrder(null);
      await loadOrders();
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Échec du lancement.';
      setLaunchingOrder(null);
      setStockRejectionNotice({
        orderRef: launchingOrder.reference,
        message: msg,
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFinishOrder = async () => {
    if (!finishingOrder) return;
    setIsActionLoading(true);

    try {
      await ordreService.terminer(finishingOrder._id);
      setFinishingOrder(null);
      await loadOrders();
    } catch (err) {
      alert(err.friendlyMessage || 'Impossible de terminer cet ordre.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openOrderSheet = async (o) => {
    try {
      const full = await ordreService.getById(o._id);
      setActiveOrderDetails(full);
    } catch (err) {
      setError(err.friendlyMessage || "Impossible de charger les détails de l'ordre.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Tableau de bord Atelier</h1>
          <p className="muted">
            Opérateur : <strong>{user?.nom || 'Atelier Safi'}</strong> · Suivi et exécution des ordres de production
          </p>
        </div>
        <button type="button" className="btn" onClick={loadOrders} disabled={isLoading}>
          <Icon name="refresh" size={16} className={isLoading ? 'spinner' : ''} />
          Rafraîchir l'atelier
        </button>
      </div>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      {/* Prominent Stock Rejection Notice */}
      {stockRejectionNotice && (
        <Notice
          tone="error"
          title={`Rejet de fabrication pour l'ordre ${stockRejectionNotice.orderRef} : Rupture de stock`}
          className="section-gap"
        >
          <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            {stockRejectionNotice.message}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setStockRejectionNotice(null)}
              style={{ minHeight: 32, fontSize: 11 }}
            >
              Fermer l'alerte
            </button>
          </div>
        </Notice>
      )}

      {/* Section 1 : Ordres en cours de fabrication (Active Production) */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid #fed7aa', marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ background: 'var(--amber-soft)', padding: '16px 24px', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="overline" style={{ color: 'var(--amber-ink)', fontSize: 10 }}>POSTES ACTIFS</span>
            <h2 style={{ color: '#7c2d12', fontSize: 18, marginTop: 2 }}>
              En cours de fabrication ({inProgressOrders.length})
            </h2>
          </div>
          <Icon name="play" size={24} style={{ color: 'var(--amber)' }} />
        </div>

        <div style={{ padding: 24 }}>
          {inProgressOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--muted)' }}>
              Aucun ordre n'est actuellement en fabrication sur vos lignes.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {inProgressOrders.map((o) => (
                <div
                  key={o._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 20,
                    background: 'var(--bg)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 17 }}>{o.reference}</strong>
                      <Badge status="EN_COURS" />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>
                      Produit : <strong>{o.produit?.nom || 'Produit'}</strong> · Quantité cible :{' '}
                      <strong>{o.quantite} unités</strong>
                    </div>
                    <small style={{ color: 'var(--muted)' }}>
                      Démarré le {o.dateDebut ? new Date(o.dateDebut).toLocaleTimeString('fr-FR') : 'Aujourd\'hui'}
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => openOrderSheet(o)}
                    >
                      Instructions
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      style={{ background: 'var(--emerald)', borderColor: 'var(--emerald)' }}
                      onClick={() => setFinishingOrder(o)}
                    >
                      <Icon name="check" size={16} />
                      Terminer la série
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 2 : Ordres prêts à démarrer (Planned Queue) */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 28, overflow: 'hidden' }}>
        <div className="panel-head" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="overline" style={{ color: 'var(--blue)', fontSize: 10 }}>FILE D'ATTENTE ATELIER</span>
            <h2 style={{ fontSize: 18, marginTop: 2 }}>
              À démarrer ({plannedOrders.length})
            </h2>
          </div>
          <Icon name="clipboard" size={20} style={{ color: 'var(--muted)' }} />
        </div>

        <div style={{ padding: 24 }}>
          {plannedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--muted)' }}>
              Aucun ordre planifié en attente de démarrage.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {plannedOrders.map((o) => (
                <div
                  key={o._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    background: 'var(--bg)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 16 }}>{o.reference}</strong>
                      <Badge status="PLANIFIE" />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>
                      Produit : <strong>{o.produit?.nom || 'Produit'}</strong> · Quantité :{' '}
                      <strong>{o.quantite} unités</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => openOrderSheet(o)}
                    >
                      Fiche technique
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => setLaunchingOrder(o)}
                    >
                      <Icon name="play" size={16} />
                      Démarrer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3 : Historique des fabrications terminées */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="panel-head" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Historique des séries terminées ({completedOrders.length})</h2>
            <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>Ordres achevés et contrôlés</p>
          </div>
          <Icon name="history" size={20} style={{ color: 'var(--muted)' }} />
        </div>

        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>RÉFÉRENCE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>PRODUIT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>QUANTITÉ FABRIQUÉE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>STATUT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>DATE FIN</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun ordre clôturé pour l'instant.
                  </td>
                </tr>
              ) : (
                completedOrders.slice(0, 5).map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{o.reference}</td>
                    <td style={{ padding: '14px 20px' }}>{o.produit?.nom || 'Produit'}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{o.quantite} unités</td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge status="TERMINE" />
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--slate)', fontSize: 12 }}>
                      {o.dateFin ? new Date(o.dateFin).toLocaleDateString('fr-FR') : 'Terminé'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal : Lancement */}
      <Modal
        isOpen={Boolean(launchingOrder)}
        onClose={() => setLaunchingOrder(null)}
        title="Confirmer le lancement de fabrication"
        subtitle={`Ordre ${launchingOrder?.reference} · ${launchingOrder?.quantite} unités de ${launchingOrder?.produit?.nom}`}
        iconName="play"
        maxWidth={500}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setLaunchingOrder(null)}
              disabled={isActionLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleLaunchOrder}
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Vérification stock & lancement...' : 'Confirmer le démarrage'}
            </button>
          </>
        }
      >
        <Notice
          tone="info"
          title="Consommation atomique FIFO"
          message="Le lancement va vérifier la disponibilité des matières premières et consommer automatiquement les lots les plus anciens (règle FIFO industrielle). Si un stock est manquant, le lancement sera refusé."
        />
      </Modal>

      {/* Confirmation Modal : Fin de fabrication */}
      <Modal
        isOpen={Boolean(finishingOrder)}
        onClose={() => setFinishingOrder(null)}
        title="Clôturer l'ordre de fabrication"
        subtitle={`Confirmez-vous que les ${finishingOrder?.quantite} unités de ${finishingOrder?.produit?.nom} ont été fabriquées et contrôlées ?`}
        iconName="check"
        maxWidth={480}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setFinishingOrder(null)}
              disabled={isActionLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn primary"
              style={{ background: 'var(--emerald)', borderColor: 'var(--emerald)' }}
              onClick={handleFinishOrder}
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Clôture en cours...' : 'Marquer comme Terminé'}
            </button>
          </>
        }
      />

      {/* Modal Fiche Technique / Pick-List */}
      <Modal
        isOpen={Boolean(activeOrderDetails)}
        onClose={() => setActiveOrderDetails(null)}
        title={`Fiche technique d'atelier · ${activeOrderDetails?.reference}`}
        subtitle={`Produit : ${activeOrderDetails?.produit?.nom} (${activeOrderDetails?.quantite} unités)`}
        iconName="file"
        maxWidth={580}
        actions={
          <button
            type="button"
            className="btn primary"
            onClick={() => setActiveOrderDetails(null)}
          >
            Fermer la fiche
          </button>
        }
      >
        <div style={{ marginTop: 12 }}>
          <span className="overline" style={{ fontSize: 10 }}>MATIÈRES PREMIÈRES À PRÉLEVER (PICK-LIST) :</span>
          <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Ingrédient</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Quantité requise</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consommée</th>
              </tr>
            </thead>
            <tbody>
              {!activeOrderDetails?.lignes || activeOrderDetails.lignes.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 16, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucune ligne détaillée disponible pour cet ordre.
                  </td>
                </tr>
              ) : (
                activeOrderDetails.lignes.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <strong>{l.matiere?.nom || 'Matière'}</strong> ({l.matiere?.reference})
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      {l.quantiteDemandee} {l.unite}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {l.quantiteConsommee} {l.unite}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
