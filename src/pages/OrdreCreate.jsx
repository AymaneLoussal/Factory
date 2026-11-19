import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import produitService from '../api/produitService';
import matiereService from '../api/matiereService';
import compositionService from '../api/compositionService';
import ordreService from '../api/ordreService';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Notice from '../components/common/Notice';

export default function OrdreCreate() {
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [compositionsMap, setCompositionsMap] = useState({});
  const [stocksMap, setStocksMap] = useState({});

  const [reference, setReference] = useState(`OF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [datePlanification, setDatePlanification] = useState(new Date().toISOString().slice(0, 10));
  const [noteInterne, setNoteInterne] = useState('');

  // Multi-product rows state
  const [productRows, setProductRows] = useState([
    { produitId: '', quantite: 10 },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load catalog data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError('');
      try {
        const [prods, mats] = await Promise.all([
          produitService.getAll(),
          matiereService.getAll(),
        ]);
        setProduits(prods);
        setMatieres(mats);

        // Fetch compositions for each product
        const compEntries = await Promise.all(
          prods.map(async (p) => [p._id, await compositionService.findByProduct(p._id)])
        );
        setCompositionsMap(Object.fromEntries(compEntries));

        // Fetch available stocks for each material
        const stockEntries = await Promise.all(
          mats.map(async (m) => {
            const info = await matiereService.getStockDisponible(m._id);
            return [m._id, info.stockDisponible];
          })
        );
        setStocksMap(Object.fromEntries(stockEntries));

        if (prods.length > 0) {
          setProductRows([{ produitId: prods[0]._id, quantite: 10 }]);
        }
      } catch (err) {
        setError('Impossible de charger le catalogue et les niveaux de stock.');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Dynamic Row Actions
  const handleAddProductRow = () => {
    const selectedIds = new Set(productRows.map((r) => r.produitId));
    const nextAvailable = produits.find((p) => !selectedIds.has(p._id)) || produits[0];
    setProductRows([
      ...productRows,
      { produitId: nextAvailable?._id || '', quantite: 5 },
    ]);
  };

  const handleRemoveProductRow = (index) => {
    if (productRows.length <= 1) return;
    setProductRows(productRows.filter((_, i) => i !== index));
  };

  const handleProductRowChange = (index, field, value) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], [field]: value };
    setProductRows(updated);
  };

  // Validation Rules
  const validation = useMemo(() => {
    const errors = [];
    if (!reference.trim()) {
      errors.push('La référence de l\'ordre est obligatoire.');
    }

    if (productRows.length === 0) {
      errors.push('La commande doit comporter au moins un produit.');
      return { errors, isValid: false };
    }

    const seenProducts = new Set();
    productRows.forEach((row, i) => {
      if (!row.produitId) {
        errors.push(`Ligne ${i + 1} : Veuillez sélectionner un produit.`);
      } else if (seenProducts.has(row.produitId)) {
        const prod = produits.find((p) => p._id === row.produitId);
        errors.push(`Ligne ${i + 1} : Le produit « ${prod?.nom || row.produitId} » est sélectionné en doublon.`);
      } else {
        seenProducts.add(row.produitId);
      }

      const q = Number(row.quantite);
      if (isNaN(q) || q < 1 || !Number.isInteger(q)) {
        errors.push(`Ligne ${i + 1} : La quantité doit être un entier strictement supérieur à 0.`);
      }
    });

    return {
      errors,
      isValid: errors.length === 0,
    };
  }, [reference, productRows, produits]);

  // Aggregated Material Calculations across ALL products in the order
  const requirements = useMemo(() => {
    const map = new Map();

    productRows.forEach((row) => {
      const q = Number(row.quantite);
      if (!row.produitId || isNaN(q) || q <= 0) return;

      const comps = compositionsMap[row.produitId] || [];
      const prod = produits.find((p) => p._id === row.produitId);

      comps.forEach((c) => {
        const mat = c.matiere;
        if (!mat) return;
        const matId = mat._id || mat.id || String(mat);
        const neededForThisProduct = q * Number(c.quantiteUnitaire);

        if (!map.has(matId)) {
          map.set(matId, {
            matiereId: matId,
            nom: mat.nom || 'Matière',
            reference: mat.reference || matId,
            unite: mat.unite || 'kg',
            totalNeeded: 0,
            breakdown: [],
          });
        }

        const item = map.get(matId);
        item.totalNeeded = Number((item.totalNeeded + neededForThisProduct).toFixed(4));
        item.breakdown.push({
          productName: prod?.nom || 'Produit',
          productQty: q,
          unitQty: c.quantiteUnitaire,
          subTotal: neededForThisProduct,
        });
      });
    });

    const list = Array.from(map.values()).map((item) => {
      const available = stocksMap[item.matiereId] ?? 0;
      const balance = Number((available - item.totalNeeded).toFixed(4));
      const isSufficient = balance >= 0;
      return {
        ...item,
        available,
        balance,
        isSufficient,
        shortage: isSufficient ? 0 : Math.abs(balance),
      };
    });

    return list;
  }, [productRows, compositionsMap, produits, stocksMap]);

  const totalUnits = useMemo(() => {
    return productRows.reduce((acc, r) => acc + (Number(r.quantite) || 0), 0);
  }, [productRows]);

  const hasShortage = useMemo(() => {
    return requirements.some((r) => !r.isSufficient);
  }, [requirements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.isValid) return;

    if (productRows.length > 1) {
      setError('La création d’un ordre multi-produits nécessite une mise à jour du serveur. Aucun ordre n’a été créé.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await ordreService.create({
        reference: reference.trim(),
        produit: productRows[0].produitId,
        quantite: Number(productRows[0].quantite),
        datePlanification: new Date(datePlanification).toISOString(),
      });

      navigate('/ordres', { replace: true });
    } catch (err) {
      setError(err.friendlyMessage || 'Erreur lors de la création de l\'ordre de fabrication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/ordres" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <Icon name="left" size={16} />
          Retour aux ordres de fabrication
        </Link>
      </div>

      <header className="page-head">
        <div>
          <h1>Nouvel ordre de fabrication multi-produits</h1>
          <p>Composez un ordre regroupant plusieurs produits avec calcul d'agrégation des stocks en temps réel.</p>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur de validation" message={error} className="section-gap" />}

      <form onSubmit={handleSubmit}>
        <div className="order-create-layout">
          <div>
            {/* Section 01 : Informations d'ordre */}
            <section className="panel" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
              <div className="form-section">
                <h2>01 / Informations générales de production</h2>
                <p className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 20 }}>
                  Définissez la référence unique et l'échéance de fabrication.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div className="field">
                    <label htmlFor="ref">
                      Référence de l'ordre <span className="required">*</span>
                    </label>
                    <input
                      id="ref"
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="datePlan">
                      Date de planification <span className="required">*</span>
                    </label>
                    <input
                      id="datePlan"
                      type="date"
                      value={datePlanification}
                      onChange={(e) => setDatePlanification(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="note">Note interne (optionnelle)</label>
                    <input
                      id="note"
                      type="text"
                      value={noteInterne}
                      onChange={(e) => setNoteInterne(e.target.value)}
                      placeholder="ex: Ligne A · Équipe du matin"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 02 : Produits à fabriquer (Multi-Produits) */}
            <section className="panel" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2>02 / Produits à fabriquer (Multi-produits)</h2>
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      Ajoutez une ou plusieurs lignes de produits. Chaque référence doit être unique et comporter une quantité positive.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleAddProductRow}
                    disabled={isSubmitting || productRows.length >= produits.length}
                  >
                    <Icon name="plus" size={16} />
                    Ajouter un produit
                  </button>
                </div>

                {validation.errors.length > 0 && (
                  <Notice tone="error" title="Vérifiez les lignes de commande :" className="section-gap">
                    <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 12 }}>
                      {validation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </Notice>
                )}

                <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                  {productRows.map((row, idx) => {
                    const comps = compositionsMap[row.produitId] || [];
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) minmax(64px, 140px) 44px',
                          gap: 12,
                          alignItems: 'center',
                          padding: 16,
                          background: 'var(--bg)',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                            Produit fini #{idx + 1}
                          </label>
                          <select
                            value={row.produitId}
                            onChange={(e) => handleProductRowChange(idx, 'produitId', e.target.value)}
                            disabled={isSubmitting}
                            style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                          >
                            <option value="">-- Sélectionner un produit --</option>
                            {produits.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.nom} ({p.reference})
                              </option>
                            ))}
                          </select>
                          <small style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                            {comps.length > 0 ? (
                              `Nomenclature : ${comps.map((c) => `${c.quantiteUnitaire} ${c.matiere?.unite || 'kg'} ${c.matiere?.nom || 'X'}`).join(' + ')}`
                            ) : (
                              <span style={{ color: 'var(--red-ink)' }}>⚠️ Aucune nomenclature définie pour ce produit</span>
                            )}
                          </small>
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                            Quantité (unités)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={row.quantite}
                            onChange={(e) => handleProductRowChange(idx, 'quantite', e.target.value)}
                            disabled={isSubmitting}
                            style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                          />
                        </div>

                        <div style={{ paddingTop: 20 }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ minHeight: 38, width: 38, padding: 0, display: 'grid', placeItems: 'center', color: 'var(--red-ink)' }}
                            onClick={() => handleRemoveProductRow(idx)}
                            disabled={isSubmitting || productRows.length <= 1}
                            title="Supprimer la ligne"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Section 03 : Matrice d'agrégation des matières premières en temps réel */}
            <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="panel-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>03 / Besoins cumulés en matières premières (Agrégation temps réel)</h2>
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Calcul exact de la somme des ingrédients nécessaires pour l'ensemble des produits commandés.
                  </p>
                </div>
                <Icon name="layers" size={24} style={{ color: 'var(--blue)' }} />
              </div>

              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>MATIÈRE PREMIÈRE</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>BESOIN TOTAL CALCULÉ</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>STOCK DISPONIBLE</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>SOLDE PRÉVU</th>
                      <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>DISPONIBILITÉ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                          Sélectionnez au moins un produit doté d'une nomenclature pour calculer les besoins.
                        </td>
                      </tr>
                    ) : (
                      requirements.map((req) => (
                        <tr key={req.matiereId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <strong>{req.nom}</strong>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                              Réf: {req.reference}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <strong className="tabular" style={{ fontSize: 15, color: 'var(--navy)' }}>
                              {req.totalNeeded} {req.unite}
                            </strong>
                          </td>
                          <td style={{ padding: '16px 20px', color: 'var(--slate)' }}>
                            {req.available} {req.unite}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <strong
                              style={{
                                color: req.isSufficient ? 'var(--green-ink)' : 'var(--red-ink)',
                              }}
                            >
                              {req.isSufficient ? `+${req.balance} ${req.unite}` : `−${req.shortage} ${req.unite}`}
                            </strong>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <Badge
                              status={req.isSufficient ? 'Available' : 'LOW'}
                              label={req.isSufficient ? 'Suffisant' : `Manque ${req.shortage} ${req.unite}`}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Formula Demonstration Panel */}
              {requirements.length > 0 && (
                <div style={{ padding: '16px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                  <span className="overline" style={{ fontSize: 10 }}>DÉCOMPOSITION DU CALCUL FORMEL :</span>
                  <div style={{ fontFamily: 'monospace', marginTop: 8, display: 'grid', gap: 4 }}>
                    {requirements.map((req) => (
                      <div key={req.matiereId}>
                        <strong>{req.nom} ({req.unite})</strong> ={' '}
                        {req.breakdown.map((b) => `(${b.productQty} × ${b.unitQty})`).join(' + ')} ={' '}
                        <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{req.totalNeeded} {req.unite}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Summary Sidebar */}
          <aside>
            <div className="panel" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
              <h2>Résumé de l'ordre</h2>
              <p className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 20 }}>
                Fabrication planifiée
              </p>

              <div style={{ display: 'grid', gap: 12, fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Produits uniques</span>
                  <strong>{productRows.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Volume total</span>
                  <strong className="tabular">{totalUnits} unités</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Statut initial</span>
                  <Badge status="PLANIFIE" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Date prévue</span>
                  <strong>{datePlanification}</strong>
                </div>
              </div>

              {hasShortage && (
                <div style={{ marginTop: 16 }}>
                  <Notice
                    tone="warning"
                    title="Alerte stock insuffisant"
                    message="Certaines matières premières sont en rupture. L'ordre peut être planifié, mais le lancement d'atelier sera bloqué jusqu'au réapprovisionnement."
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn primary full"
                disabled={isSubmitting || !validation.isValid}
                style={{ marginTop: 24 }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span> Création...
                  </>
                ) : (
                  <>
                    Créer l'ordre de fabrication
                    <Icon name="arrow" size={16} />
                  </>
                )}
              </button>

              <Link to="/ordres" className="btn full" style={{ marginTop: 10, textAlign: 'center' }}>
                Annuler
              </Link>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
