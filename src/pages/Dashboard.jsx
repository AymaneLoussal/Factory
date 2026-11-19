import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import produitService from '../api/produitService';
import matiereService from '../api/matiereService';
import ordreService from '../api/ordreService';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Notice from '../components/common/Notice';

export default function Dashboard() {
  const [produits, setProduits] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [ordres, setOrdres] = useState([]);
  const [stocksMap, setStocksMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [produitsData, matieresData, ordresData] = await Promise.all([
        produitService.getAll(),
        matiereService.getAll(),
        ordreService.getAll(),
      ]);

      setProduits(produitsData);
      setMatieres(matieresData);
      setOrdres(ordresData);

      // Fetch stock availability for each material
      const stockEntries = await Promise.all(
        matieresData.map(async (m) => {
          const stockInfo = await matiereService.getStockDisponible(m._id);
          return [m._id, stockInfo.stockDisponible];
        })
      );
      setStocksMap(Object.fromEntries(stockEntries));
    } catch (err) {
      setError('Impossible de charger les données du tableau de bord. Vérifiez la connexion API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const stats = useMemo(() => {
    const ordersByStatus = {
      PLANIFIE: 0,
      EN_COURS: 0,
      TERMINE: 0,
      ANNULE: 0,
    };

    ordres.forEach((o) => {
      const s = o.status || 'PLANIFIE';
      if (ordersByStatus[s] !== undefined) {
        ordersByStatus[s]++;
      }
    });

    const lowStockMaterials = matieres.filter((m) => {
      const currentStock = stocksMap[m._id] ?? 0;
      return currentStock <= m.seuilAlerte;
    });

    return {
      ordersByStatus,
      totalOrders: ordres.length,
      lowStockMaterials,
      totalProduits: produits.length,
      totalMatieres: matieres.length,
    };
  }, [ordres, matieres, produits, stocksMap]);

  return (
    <div>
      {/* Page Header */}
      <header className="page-head">
        <div>
          <h1>Vue générale de l'usine</h1>
          <p>Supervisez en temps réel les indicateurs de production et l'état des stocks.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={loadData} disabled={isLoading}>
            <Icon name="refresh" size={16} className={isLoading ? 'spinner' : ''} />
            Actualiser
          </button>
          <Link to="/ordres/nouveau" className="btn primary">
            <Icon name="plus" size={16} />
            Nouvel ordre
          </Link>
        </div>
      </header>

      {error && (
        <Notice tone="error" title="Erreur de synchronisation" message={error} className="section-gap" />
      )}

      {/* KPI Metrics */}
      <div className="grid metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
        <article className="metric" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div className="metric-top" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
            PRODUITS FINIS
            <span className="metric-icon" style={{ color: 'var(--blue)' }}>
              <Icon name="box" size={20} />
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: 36, fontWeight: 700, margin: '12px 0 4px', color: 'var(--navy)' }}>
            {isLoading ? '...' : stats.totalProduits}
          </div>
          <div className="metric-foot" style={{ fontSize: 12, color: 'var(--muted)' }}>
            Références au catalogue
          </div>
        </article>

        <article className="metric" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div className="metric-top" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
            MATIÈRES PREMIÈRES
            <span className="metric-icon" style={{ color: stats.lowStockMaterials.length > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
              <Icon name="layers" size={20} />
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: 36, fontWeight: 700, margin: '12px 0 4px', color: 'var(--navy)' }}>
            {isLoading ? '...' : stats.totalMatieres}
          </div>
          <div className="metric-foot" style={{ fontSize: 12 }}>
            {stats.lowStockMaterials.length > 0 ? (
              <span style={{ color: 'var(--red-ink)', fontWeight: 600 }}>
                ⚠️ {stats.lowStockMaterials.length} sous le seuil d'alerte
              </span>
            ) : (
              <span style={{ color: 'var(--green-ink)', fontWeight: 600 }}>
                ✓ Tous les stocks sont suffisants
              </span>
            )}
          </div>
        </article>

        <article className="metric" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div className="metric-top" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
            ORDRES DE FABRICATION
            <span className="metric-icon" style={{ color: 'var(--blue)' }}>
              <Icon name="clipboard" size={20} />
            </span>
          </div>
          <div className="metric-value" style={{ fontSize: 36, fontWeight: 700, margin: '12px 0 4px', color: 'var(--navy)' }}>
            {isLoading ? '...' : stats.totalOrders}
          </div>
          <div className="metric-foot" style={{ fontSize: 12, color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--amber-ink)' }}>{stats.ordersByStatus.EN_COURS} en cours</strong> · {stats.ordersByStatus.PLANIFIE} planifiés
          </div>
        </article>
      </div>

      {/* Split Grid: Status Breakdown & Low Stock Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Section: Répartition des ordres par statut */}
        <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="panel-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Répartition des Ordres de fabrication</h2>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Suivi de l'état d'avancement global</p>
            </div>
            <Link to="/ordres" className="small" style={{ fontSize: 12 }}>
              Gérer les ordres
            </Link>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--blue-soft)', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <span className="overline" style={{ color: 'var(--blue)', fontSize: 10 }}>PLANIFIÉS</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blue)', margin: '8px 0 4px' }}>
                  {stats.ordersByStatus.PLANIFIE}
                </div>
                <small style={{ color: 'var(--slate)' }}>Prêts pour lancement</small>
              </div>

              <div style={{ padding: 16, background: 'var(--amber-soft)', borderRadius: 8, border: '1px solid #fde68a' }}>
                <span className="overline" style={{ color: 'var(--amber-ink)', fontSize: 10 }}>EN FABRICATION</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber-ink)', margin: '8px 0 4px' }}>
                  {stats.ordersByStatus.EN_COURS}
                </div>
                <small style={{ color: 'var(--slate)' }}>Lignes actives en atelier</small>
              </div>

              <div style={{ padding: 16, background: 'var(--green-soft)', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <span className="overline" style={{ color: 'var(--green-ink)', fontSize: 10 }}>TERMINÉS</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green-ink)', margin: '8px 0 4px' }}>
                  {stats.ordersByStatus.TERMINE}
                </div>
                <small style={{ color: 'var(--slate)' }}>Production clôturée</small>
              </div>

              <div style={{ padding: 16, background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span className="overline" style={{ color: 'var(--slate)', fontSize: 10 }}>ANNULÉS</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--slate)', margin: '8px 0 4px' }}>
                  {stats.ordersByStatus.ANNULE}
                </div>
                <small style={{ color: 'var(--muted)' }}>Ordres décommandés</small>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Alertes de stock bas */}
        <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="panel-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Alertes de stock</h2>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Matières premières nécessitant un réapprovisionnement</p>
            </div>
            <Link to="/lots" className="small" style={{ fontSize: 12 }}>
              Entrées de stock
            </Link>
          </div>

          <div style={{ padding: 24 }}>
            {stats.lowStockMaterials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div className="empty-icon" style={{ background: 'var(--green-soft)', color: 'var(--green-ink)' }}>
                  <Icon name="checkCircle" size={28} />
                </div>
                <h3>Stocks sous contrôle</h3>
                <p className="muted" style={{ fontSize: 12, margin: '8px 0' }}>
                  Aucune matière première n'est actuellement en situation de rupture ou sous son seuil d'alerte.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {stats.lowStockMaterials.map((m) => {
                  const current = stocksMap[m._id] ?? 0;
                  return (
                    <div
                      key={m._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--red-soft)',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                      }}
                    >
                      <div>
                        <strong>{m.nom}</strong>
                        <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 2 }}>
                          Réf: <code>{m.reference}</code> · Seuil critique : {m.seuilAlerte} {m.unite}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-ink)' }}>
                          {current} {m.unite}
                        </div>
                        <Badge status="LOW" label="Stock critique" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Orders Overview */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="panel-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Activité récente des ordres</h2>
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Derniers ordres de fabrication enregistrés</p>
          </div>
          <Link to="/ordres" className="small" style={{ fontSize: 12 }}>
            Voir tous les ordres ({ordres.length})
          </Link>
        </div>

        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>RÉFÉRENCE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>PRODUIT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>QUANTITÉ</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>STATUT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {ordres.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun ordre de fabrication enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                ordres.slice(0, 5).map((ordre) => (
                  <tr key={ordre._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>{ordre.reference}</td>
                    <td style={{ padding: '16px 20px' }}>
                      {ordre.produit?.nom || ordre.produit?.reference || 'Produit'}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600 }}>{ordre.quantite} unités</td>
                    <td style={{ padding: '16px 20px' }}>
                      <Badge status={ordre.status} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <Link to={`/ordres/${ordre._id}`} className="btn" style={{ minHeight: 32, padding: '4px 10px', fontSize: 11 }}>
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
