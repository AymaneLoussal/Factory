import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import produitService from '../api/produitService';
import matiereService from '../api/matiereService';
import compositionService from '../api/compositionService';
import Icon from '../components/common/Icon';
import Notice from '../components/common/Notice';

export default function Compositions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProductId = searchParams.get('produitId') || '';

  const [produits, setProduits] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [compositionRows, setCompositionRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Load products and materials
  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      setError('');
      try {
        const [prods, mats] = await Promise.all([
          produitService.getAll(),
          matiereService.getAll(),
        ]);
        setProduits(prods);
        setMatieres(mats);

        if (!selectedProductId && prods.length > 0) {
          setSelectedProductId(prods[0]._id);
        }
      } catch (err) {
        setError('Impossible de charger le catalogue des produits et matières.');
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Load composition for selected product
  useEffect(() => {
    if (!selectedProductId) return;
    setSearchParams({ produitId: selectedProductId });

    async function loadComposition() {
      try {
        const comps = await compositionService.findByProduct(selectedProductId);
        if (comps && comps.length > 0) {
          setCompositionRows(
            comps.map((c) => ({
              _id: c._id,
              matiereId: c.matiere?._id || c.matiere,
              quantiteUnitaire: c.quantiteUnitaire,
            }))
          );
        } else {
          // If empty, offer one default row if materials exist
          setCompositionRows([
            { matiereId: matieres[0]?._id || '', quantiteUnitaire: 1 },
          ]);
        }
      } catch (err) {
        setCompositionRows([]);
      }
    }

    loadComposition();
  }, [selectedProductId, matieres]);

  const selectedProduct = useMemo(
    () => produits.find((p) => p._id === selectedProductId),
    [produits, selectedProductId]
  );

  const handleAddRow = () => {
    // Find first unused material
    const usedIds = new Set(compositionRows.map((r) => r.matiereId));
    const availableMat = matieres.find((m) => !usedIds.has(m._id)) || matieres[0];

    setCompositionRows([
      ...compositionRows,
      { matiereId: availableMat?._id || '', quantiteUnitaire: 1 },
    ]);
    setSuccessNotice('');
  };

  const handleRemoveRow = (index) => {
    const updated = compositionRows.filter((_, i) => i !== index);
    setCompositionRows(updated);
    setSuccessNotice('');
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...compositionRows];
    updated[index] = { ...updated[index], [field]: value };
    setCompositionRows(updated);
    setSuccessNotice('');
  };

  // Validation logic
  const validationErrors = useMemo(() => {
    const errors = [];
    if (compositionRows.length === 0) {
      errors.push('La composition doit comporter au moins une matière première.');
      return errors;
    }

    const seenMaterials = new Set();
    compositionRows.forEach((row, i) => {
      if (!row.matiereId) {
        errors.push(`Ligne ${i + 1} : Veuillez sélectionner une matière première.`);
      } else if (seenMaterials.has(row.matiereId)) {
        const mat = matieres.find((m) => m._id === row.matiereId);
        errors.push(`Ligne ${i + 1} : La matière « ${mat?.nom || row.matiereId} » est présente plusieurs fois.`);
      } else {
        seenMaterials.add(row.matiereId);
      }

      const q = Number(row.quantiteUnitaire);
      if (isNaN(q) || q <= 0) {
        errors.push(`Ligne ${i + 1} : La quantité unitaire doit être un nombre strictement supérieur à 0.`);
      }
    });

    return errors;
  }, [compositionRows, matieres]);

  const handleSaveComposition = async () => {
    if (validationErrors.length > 0) return;
    setIsSaving(true);
    setError('');
    setSuccessNotice('');

    try {
      // Delete existing and re-create, or save each composition line
      const existing = await compositionService.findByProduct(selectedProductId);
      for (const ex of existing) {
        await compositionService.delete(ex._id);
      }

      for (const row of compositionRows) {
        await compositionService.create({
          produit: selectedProductId,
          matiere: row.matiereId,
          quantiteUnitaire: Number(row.quantiteUnitaire),
        });
      }

      setSuccessNotice('Nomenclature (BOM) enregistrée et synchronisée avec succès !');
    } catch (err) {
      setError(err.friendlyMessage || 'Erreur lors de l\'enregistrement de la composition.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Nomenclatures Produits (Bill of Materials)</h1>
          <p>Définissez les matières premières et ratios exacts requis pour fabriquer une unité de produit fini.</p>
        </div>
        <div className="head-actions">
          <Link to="/produits" className="btn">
            <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
            Retour Catalogue
          </Link>
          <button
            type="button"
            className="btn primary"
            onClick={handleSaveComposition}
            disabled={isSaving || validationErrors.length > 0}
          >
            {isSaving ? (
              <>
                <span className="spinner"></span> Sauvegarde...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                Enregistrer la nomenclature
              </>
            )}
          </button>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}
      {successNotice && <Notice tone="success" title="Succès" message={successNotice} className="section-gap" />}

      {/* Product Selector */}
      <div className="panel" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="prod-select" style={{ fontSize: 13, fontWeight: 600 }}>
              Sélectionner le produit fini à configurer :
            </label>
            <select
              id="prod-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={isLoading || isSaving}
              style={{ fontSize: 14, fontWeight: 600, padding: 10 }}
            >
              {produits.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nom} ({p.reference})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div style={{ padding: '12px 16px', background: 'var(--blue-soft)', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>PRODUIT SÉLECTIONNÉ</div>
              <strong style={{ fontSize: 15 }}>{selectedProduct.nom}</strong>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                Réf: <code>{selectedProduct.reference}</code> · {selectedProduct.description || 'Sans description'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic BOM Table */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="panel-head" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Ingrédients requis par unité produite</h2>
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Chaque matière première doit être unique et comporter une quantité positive.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={handleAddRow}
            disabled={isSaving || matieres.length === 0}
          >
            <Icon name="plus" size={16} />
            Ajouter une matière
          </button>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div style={{ padding: '16px 24px' }}>
            <Notice tone="error" title="Contraintes de composition non respectées :">
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 12 }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </Notice>
          </div>
        )}

        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', width: '50%' }}>
                  MATIÈRE PREMIÈRE
                </th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', width: '35%' }}>
                  QUANTITÉ UNITAIRE REQUISE
                </th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', textAlign: 'right', width: '15%' }}>
                  SUPPRIMER
                </th>
              </tr>
            </thead>
            <tbody>
              {compositionRows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun composant défini pour ce produit. Cliquez sur « Ajouter une matière » ci-dessus.
                  </td>
                </tr>
              ) : (
                compositionRows.map((row, idx) => {
                  const selectedMat = matieres.find((m) => m._id === row.matiereId);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <select
                          value={row.matiereId}
                          onChange={(e) => handleRowChange(idx, 'matiereId', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)' }}
                          disabled={isSaving}
                        >
                          <option value="">-- Choisir une matière --</option>
                          {matieres.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.nom} ({m.reference} - {m.unite})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="number"
                            min="0.0001"
                            step="any"
                            value={row.quantiteUnitaire}
                            onChange={(e) => handleRowChange(idx, 'quantiteUnitaire', e.target.value)}
                            style={{ width: 140, padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)' }}
                            disabled={isSaving}
                            placeholder="ex: 2"
                          />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)' }}>
                            {selectedMat?.unite || 'unité(s)'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ minHeight: 32, padding: '4px 8px', color: 'var(--red-ink)' }}
                          onClick={() => handleRemoveRow(idx)}
                          disabled={isSaving}
                          title="Supprimer la ligne"
                        >
                          <Icon name="trash" size={16} />
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
    </div>
  );
}
