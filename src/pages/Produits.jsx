import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import produitService from '../api/produitService';
import compositionService from '../api/compositionService';
import Icon from '../components/common/Icon';
import Modal from '../components/common/Modal';
import Notice from '../components/common/Notice';

export default function Produits() {
  const [produits, setProduits] = useState([]);
  const [compCounts, setCompCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [formData, setFormData] = useState({
    reference: '',
    nom: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deletingProduit, setDeletingProduit] = useState(null);

  const loadProduits = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await produitService.getAll();
      setProduits(data);

      // Fetch composition counts
      const counts = await Promise.all(
        data.map(async (p) => {
          const comps = await compositionService.findByProduct(p._id);
          return [p._id, comps.length];
        })
      );
      setCompCounts(Object.fromEntries(counts));
    } catch (err) {
      setError('Impossible de charger le catalogue des produits finis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduits();
  }, []);

  const openCreateModal = () => {
    setEditingProduit(null);
    setFormData({
      reference: `PR-00${produits.length + 1}`,
      nom: '',
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduit(p);
    setFormData({
      reference: p.reference,
      nom: p.nom,
      description: p.description || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.reference.trim() || !formData.nom.trim()) {
      setFormError('La référence et le nom du produit sont obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        reference: formData.reference.trim(),
        nom: formData.nom.trim(),
        description: formData.description.trim(),
      };

      if (editingProduit) {
        await produitService.update(editingProduit._id, payload);
      } else {
        await produitService.create(payload);
      }

      setIsModalOpen(false);
      await loadProduits();
    } catch (err) {
      setFormError(err.friendlyMessage || 'Erreur lors de l\'enregistrement du produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduit) return;
    setIsSubmitting(true);
    try {
      await produitService.delete(deletingProduit._id);
      setDeletingProduit(null);
      await loadProduits();
    } catch (err) {
      alert(err.friendlyMessage || 'Impossible de supprimer ce produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProduits = useMemo(() => {
    return produits.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.nom.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [produits, searchQuery]);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Catalogue Produits</h1>
          <p>Gestion des produits finis manufacturés et accès à leurs nomenclatures (BOM).</p>
        </div>
        <div className="head-actions">
          <Link to="/compositions" className="btn">
            <Icon name="file" size={16} />
            Nomenclatures (BOM)
          </Link>
          <button type="button" className="btn primary" onClick={openCreateModal}>
            <Icon name="plus" size={16} />
            Nouveau produit
          </button>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      {/* Search Bar */}
      <div style={{ marginBottom: 24, maxWidth: 500 }}>
        <div className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Rechercher un produit par nom, référence ou description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid / Table */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>RÉFÉRENCE & NOM</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>DESCRIPTION</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>NOMENCLATURE (BOM)</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center' }}>
                    <span className="spinner"></span> Chargement du catalogue produits...
                  </td>
                </tr>
              ) : filteredProduits.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun produit trouvé dans le catalogue.
                  </td>
                </tr>
              ) : (
                filteredProduits.map((p) => {
                  const count = compCounts[p._id] || 0;
                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <strong style={{ fontSize: 14 }}>{p.nom}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          Réf: <code>{p.reference}</code>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--slate)', fontSize: 13 }}>
                        {p.description || 'Aucune description'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Link
                          to={`/compositions?produitId=${p._id}`}
                          className="btn"
                          style={{
                            minHeight: 30,
                            padding: '3px 10px',
                            fontSize: 11,
                            background: count > 0 ? 'var(--blue-soft)' : '#fef2f2',
                            color: count > 0 ? 'var(--blue)' : 'var(--red)',
                            borderColor: count > 0 ? '#bfdbfe' : '#fecaca',
                          }}
                        >
                          <Icon name="layers" size={14} />
                          {count > 0 ? `${count} ingrédient(s)` : 'Définir composition (0)'}
                        </Link>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ minHeight: 32, padding: '4px 8px' }}
                            onClick={() => openEditModal(p)}
                            title="Modifier"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ minHeight: 32, padding: '4px 8px', color: 'var(--red-ink)' }}
                            onClick={() => setDeletingProduit(p)}
                            title="Supprimer"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Form: Create / Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduit ? 'Modifier le produit' : 'Nouveau produit manufacturé'}
        subtitle="Renseignez la référence et la désignation commerciale du produit."
        iconName="box"
        maxWidth={500}
      >
        <form onSubmit={handleFormSubmit}>
          {formError && <Notice tone="error" title="Erreur" message={formError} className="section-gap" />}

          <div className="field">
            <label htmlFor="prod-ref">
              Référence produit unique <span className="required">*</span>
            </label>
            <input
              id="prod-ref"
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="field">
            <label htmlFor="prod-nom">
              Nom du produit <span className="required">*</span>
            </label>
            <input
              id="prod-nom"
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="ex: Châssis métallique, Kit de fixation..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="field">
            <label htmlFor="prod-desc">Description industrielle</label>
            <textarea
              id="prod-desc"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Spécifications techniques, usage..."
              disabled={isSubmitting}
            />
          </div>

          <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le produit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete Product */}
      <Modal
        isOpen={Boolean(deletingProduit)}
        onClose={() => setDeletingProduit(null)}
        title="Supprimer le produit"
        subtitle={`Êtes-vous sûr de vouloir supprimer définitivement le produit ${deletingProduit?.nom} (${deletingProduit?.reference}) ?`}
        iconName="alert"
        isDanger={true}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setDeletingProduit(null)}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn primary"
              style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Suppression...' : 'Supprimer'}
            </button>
          </>
        }
      />
    </div>
  );
}
