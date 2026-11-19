import React, { useState, useEffect } from 'react';
import lotStockService from '../api/lotStockService';
import matiereService from '../api/matiereService';
import Icon from '../components/common/Icon';
import Modal from '../components/common/Modal';
import Notice from '../components/common/Notice';

export default function Lots() {
  const [lots, setLots] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // New Lot Modal
  const [isEntreeModalOpen, setIsEntreeModalOpen] = useState(false);
  const [entreeData, setEntreeData] = useState({
    matiere: '',
    numeroLot: '',
    quantite: 50,
    dateEntree: new Date().toISOString().slice(0, 10),
    dateExpiration: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adjustment Modal
  const [adjustingLot, setAdjustingLot] = useState(null);
  const [adjustData, setAdjustData] = useState({
    quantiteAjustement: 0,
    raison: 'Inventaire périodique',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [lotsData, matieresData] = await Promise.all([
        lotStockService.getAllLots(),
        matiereService.getAll(),
      ]);
      setLots(lotsData);
      setMatieres(matieresData);
    } catch (err) {
      setError('Impossible de charger les lots de stock.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEntreeModal = () => {
    setEntreeData({
      matiere: matieres[0]?._id || '',
      numeroLot: `LOT-${Date.now().toString().slice(-6)}`,
      quantite: 50,
      dateEntree: new Date().toISOString().slice(0, 10),
      dateExpiration: '',
    });
    setFormError('');
    setIsEntreeModalOpen(true);
  };

  const handleEntreeSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!entreeData.matiere || !entreeData.numeroLot.trim() || !entreeData.dateEntree) {
      setFormError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (Number(entreeData.quantite) <= 0) {
      setFormError('La quantité doit être strictement supérieure à 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await lotStockService.enregistrerEntree({
        matiere: entreeData.matiere,
        numeroLot: entreeData.numeroLot.trim(),
        quantite: Number(entreeData.quantite),
        dateEntree: new Date(entreeData.dateEntree).toISOString(),
        dateExpiration: entreeData.dateExpiration
          ? new Date(entreeData.dateExpiration).toISOString()
          : undefined,
      });

      setIsEntreeModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.friendlyMessage || 'Erreur lors de l\'enregistrement de l\'entrée de stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdjustModal = (lot) => {
    setAdjustingLot(lot);
    setAdjustData({
      quantiteAjustement: 0,
      raison: 'Régularisation inventaire d\'atelier',
    });
    setFormError('');
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!adjustData.raison.trim()) {
      setFormError('Le motif d\'ajustement est obligatoire.');
      return;
    }

    const adjustQty = Number(adjustData.quantiteAjustement);
    if (adjustQty === 0 || isNaN(adjustQty)) {
      setFormError('La quantité d\'ajustement doit être différente de zéro.');
      return;
    }

    if (adjustingLot.quantiteRestante + adjustQty < 0) {
      setFormError('L\'ajustement ne peut pas rendre la quantité restante négative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await lotStockService.ajusterLot(adjustingLot._id, {
        delta: adjustQty,
        raison: adjustData.raison.trim(),
      });

      setAdjustingLot(null);
      await loadData();
    } catch (err) {
      setFormError(err.friendlyMessage || 'Erreur lors de l\'ajustement du lot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Lots et Entrées de stock</h1>
          <p>Réceptionnez des lots fournisseurs et ajustez le stock disponible pour la production.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn primary" onClick={openEntreeModal}>
            <Icon name="plus" size={16} />
            Nouvelle entrée de lot
          </button>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>NUMÉRO DE LOT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>MATIÈRE PREMIÈRE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>QUANTITÉ RESTANTE / INITIALE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>DATE D'ENTRÉE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>EXPIRATION</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>
                    <span className="spinner"></span> Chargement des lots de stock...
                  </td>
                </tr>
              ) : lots.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun lot de stock enregistré. Cliquez sur « Nouvelle entrée de lot » pour approvisionner l'usine.
                  </td>
                </tr>
              ) : (
                lots.map((lot) => {
                  const percent = lot.quantiteInitiale > 0 ? (lot.quantiteRestante / lot.quantiteInitiale) * 100 : 0;
                  return (
                    <tr key={lot._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                        <code>{lot.numeroLot}</code>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <strong>{lot.matiere?.nom || 'Matière'}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          Réf: {lot.matiere?.reference}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="tabular" style={{ fontWeight: 600, fontSize: 14 }}>
                            {lot.quantiteRestante} / {lot.quantiteInitiale} {lot.matiere?.unite}
                          </span>
                        </div>
                        <div className="progress-track" style={{ width: 140, height: 6, background: '#e2e8f0', borderRadius: 3, marginTop: 4 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, percent))}%`,
                              height: '100%',
                              borderRadius: 3,
                              background: percent < 25 ? 'var(--red)' : percent < 50 ? 'var(--amber)' : 'var(--emerald)',
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate)' }}>
                        {lot.dateEntree ? new Date(lot.dateEntree).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate)' }}>
                        {lot.dateExpiration ? new Date(lot.dateExpiration).toLocaleDateString('fr-FR') : 'Non périssable'}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ minHeight: 32, padding: '4px 10px', fontSize: 11 }}
                          onClick={() => openAdjustModal(lot)}
                        >
                          Ajuster
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Entrée de Stock */}
      <Modal
        isOpen={isEntreeModalOpen}
        onClose={() => setIsEntreeModalOpen(false)}
        title="Réception de lot (Entrée de stock)"
        subtitle="Enregistrez l'arrivée d'une matière première en magasin."
        iconName="box"
        maxWidth={500}
      >
        <form onSubmit={handleEntreeSubmit}>
          {formError && <Notice tone="error" title="Erreur" message={formError} className="section-gap" />}

          <div className="field">
            <label htmlFor="lot-mat">
              Matière première <span className="required">*</span>
            </label>
            <select
              id="lot-mat"
              value={entreeData.matiere}
              onChange={(e) => setEntreeData({ ...entreeData, matiere: e.target.value })}
              required
              disabled={isSubmitting}
            >
              {matieres.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.nom} ({m.reference} - en {m.unite})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="lot-num">
              Numéro de lot unique <span className="required">*</span>
            </label>
            <input
              id="lot-num"
              type="text"
              value={entreeData.numeroLot}
              onChange={(e) => setEntreeData({ ...entreeData, numeroLot: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="field">
            <label htmlFor="lot-qty">
              Quantité reçue <span className="required">*</span>
            </label>
            <input
              id="lot-qty"
              type="number"
              min="0.001"
              step="any"
              value={entreeData.quantite}
              onChange={(e) => setEntreeData({ ...entreeData, quantite: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label htmlFor="lot-date">
                Date d'entrée <span className="required">*</span>
              </label>
              <input
                id="lot-date"
                type="date"
                value={entreeData.dateEntree}
                onChange={(e) => setEntreeData({ ...entreeData, dateEntree: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="field">
              <label htmlFor="lot-exp">Date de péremption</label>
              <input
                id="lot-exp"
                type="date"
                value={entreeData.dateExpiration}
                onChange={(e) => setEntreeData({ ...entreeData, dateExpiration: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setIsEntreeModalOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'entrée'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajustement de Stock */}
      <Modal
        isOpen={Boolean(adjustingLot)}
        onClose={() => setAdjustingLot(null)}
        title="Ajustement de stock de lot"
        subtitle={`Lot ${adjustingLot?.numeroLot} · Stock actuel : ${adjustingLot?.quantiteRestante} ${adjustingLot?.matiere?.unite}`}
        iconName="alert"
        maxWidth={460}
      >
        <form onSubmit={handleAdjustSubmit}>
          {formError && <Notice tone="error" title="Erreur" message={formError} className="section-gap" />}

          <div className="field">
            <label htmlFor="adj-qty">
              Variation (+ pour ajout, - pour retrait) <span className="required">*</span>
            </label>
            <input
              id="adj-qty"
              type="number"
              step="any"
              value={adjustData.quantiteAjustement}
              onChange={(e) => setAdjustData({ ...adjustData, quantiteAjustement: e.target.value })}
              required
              disabled={isSubmitting}
            />
            <span className="hint">
              Nouveau solde estimé :{' '}
              <strong>
                {adjustingLot ? adjustingLot.quantiteRestante + (Number(adjustData.quantiteAjustement) || 0) : 0}{' '}
                {adjustingLot?.matiere?.unite}
              </strong>
            </span>
          </div>

          <div className="field">
            <label htmlFor="adj-raison">
              Motif d'ajustement obligatoire <span className="required">*</span>
            </label>
            <input
              id="adj-raison"
              type="text"
              value={adjustData.raison}
              onChange={(e) => setAdjustData({ ...adjustData, raison: e.target.value })}
              placeholder="ex: Perte matérielle, écart d'inventaire..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setAdjustingLot(null)}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'Ajustement...' : 'Valider l\'ajustement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
