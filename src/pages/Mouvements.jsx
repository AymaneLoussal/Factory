import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Notice from '../components/common/Notice';

export default function Mouvements() {
  const [mouvements, setMouvements] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // ALL, ENTREE, SORTIE, AJUSTEMENT
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMouvements = async () => {
    setIsLoading(true);
    setError('');
    setMouvements([]);
    setError("L'historique des mouvements n'est pas disponible sur ce serveur.");
    setIsLoading(false);
  };

  useEffect(() => {
    loadMouvements();
  }, []);

  const filteredMouvements = useMemo(() => {
    return mouvements.filter((m) => {
      const matchesType = filterType === 'ALL' || m.type === filterType;
      const q = searchQuery.toLowerCase();
      const matName = m.matiere?.nom || m.matiere?.reference || '';
      const lotNum = m.lot?.numeroLot || '';
      const orderRef = m.ordre?.reference || '';
      const raison = m.raison || '';

      const matchesSearch =
        matName.toLowerCase().includes(q) ||
        lotNum.toLowerCase().includes(q) ||
        orderRef.toLowerCase().includes(q) ||
        raison.toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [mouvements, filterType, searchQuery]);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Historique des mouvements de stock</h1>
          <p>Journal d'audit inaltérable de toutes les entrées, consommations FIFO et ajustements d'usine.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={loadMouvements} disabled={isLoading}>
            <Icon name="refresh" size={16} className={isLoading ? 'spinner' : ''} />
            Actualiser
          </button>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      {/* Filters and search */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="search" style={{ flex: 1, minWidth: 260 }}>
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Rechercher par matière, lot, référence d'ordre ou motif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'ENTREE', 'SORTIE', 'AJUSTEMENT'].map((t) => (
            <button
              key={t}
              type="button"
              className={`btn ${filterType === t ? 'primary' : ''}`}
              onClick={() => setFilterType(t)}
              style={{ minHeight: 38, fontSize: 12 }}
            >
              {t === 'ALL' ? 'Tous' : t}
            </button>
          ))}
        </div>
      </div>

      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>DATE & HEURE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>TYPE DE MOUVEMENT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>MATIÈRE PREMIÈRE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>LOT / ORDRE ASSOCIÉ</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>QUANTITÉ</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>MOTIF / DÉTAIL</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>
                    <span className="spinner"></span> Chargement des mouvements d'audit...
                  </td>
                </tr>
              ) : filteredMouvements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun mouvement de stock enregistré correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredMouvements.map((m) => {
                  const isEntree = m.type === 'ENTREE';
                  const isSortie = m.type === 'SORTIE';
                  return (
                    <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate)' }}>
                        {m.date ? new Date(m.date).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          className={`badge ${
                            isEntree ? 'available' : isSortie ? 'progress' : 'warning'
                          }`}
                        >
                          <i></i>
                          {m.type}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        {m.matiere?.nom || m.matiere?.reference || 'Matière'}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13 }}>
                        {m.lot?.numeroLot ? (
                          <code>Lot: {m.lot.numeroLot}</code>
                        ) : m.ordre?.reference ? (
                          <code>OF: {m.ordre.reference}</code>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <strong
                          className="tabular"
                          style={{
                            fontSize: 14,
                            color: isEntree ? 'var(--green-ink)' : 'var(--red-ink)',
                          }}
                        >
                          {isEntree ? `+${m.quantite}` : `-${m.quantite}`} {m.matiere?.unite || ''}
                        </strong>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--slate)', fontSize: 13 }}>
                        {m.raison || 'Opération système'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
