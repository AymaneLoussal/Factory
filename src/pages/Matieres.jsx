import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import matiereService from '../api/matiereService';
import Icon from '../components/common/Icon';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Notice from '../components/common/Notice';

export default function Matieres() {
  const [matieres, setMatieres] = useState([]);
  const [stocksMap, setStocksMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, LOW, OK
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState(null);
  const [formData, setFormData] = useState({
    reference: '',
    nom: '',
    unite: 'kg',
    seuilAlerte: 10,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingMatiere, setDeletingMatiere] = useState(null);

  const loadMatieres = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await matiereService.getAll();
      setMatieres(data);

      const stockPairs = await Promise.all(
        data.map(async (m) => {
          const stockInfo = await matiereService.getStockDisponible(m._id);
          return [m._id, stockInfo.stockDisponible];
        })
      );
      setStocksMap(Object.fromEntries(stockPairs));
    } catch (err) {
      setError('Impossible de charger le catalogue des matières premières.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatieres();
  }, []);

  const openCreateModal = () => {
    setEditingMatiere(null);
    setFormData({
      reference: `RM-00${matieres.length + 1}`,
      nom: '',
      unite: 'kg',
      seuilAlerte: 10,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMatiere(m);
    setFormData({
      reference: m.reference,
      nom: m.nom,
      unite: m.unite,
      seuilAlerte: m.seuilAlerte,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.reference.trim() || !formData.nom.trim() || !formData.unite.trim()) {
      setFormError('La référence, le nom et l\'unité sont obligatoires.');
      return;
    }

    if (formData.seuilAlerte < 0 || isNaN(formData.seuilAlerte)) {
      setFormError('Le seuil d\'alerte doit être un nombre positif ou nul.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        reference: formData.reference.trim(),
        nom: formData.nom.trim(),
        unite: formData.unite.trim(),
        seuilAlerte: Number(formData.seuilAlerte),
      };

      if (editingMatiere) {
        await matiereService.update(editingMatiere._id, payload);
      } else {
        await matiereService.create(payload);
      }

      setIsModalOpen(false);
      await loadMatieres();
    } catch (err) {
      setFormError(err.friendlyMessage || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMatiere) return;
    setIsSubmitting(true);
    try {
      await matiereService.delete(deletingMatiere._id);
      setDeletingMatiere(null);
      await loadMatieres();
    } catch (err) {
      alert(err.friendlyMessage || 'Impossible de supprimer cette matière.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMatieres = useMemo(() => {
    return matieres.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.nom.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q) ||
        m.unite.toLowerCase().includes(q);

      const stock = stocksMap[m._id] ?? 0;
      const isLow = stock <= m.seuilAlerte;

      if (statusFilter === 'LOW') return matchesSearch && isLow;
      if (statusFilter === 'OK') return matchesSearch && !isLow;
      return matchesSearch;
    });
  }, [matieres, searchQuery, statusFilter, stocksMap]);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Matières premières</h1>
          <p>Catalogue, niveaux de stock d'atelier et seuils critiques de réapprovisionnement.</p>
        </div>
        <div className="head-actions">
          <Link to="/lots" className="btn">
            <Icon name="box" size={16} />
            Entrées de stock
          </Link>
          <button type="button" className="btn primary" onClick={openCreateModal}>
            <Icon name="plus" size={16} />
            Ajouter une matière
          </button>
        </div>
      </header>

      {error && <Notice tone="error" title="Erreur" message={error} className="section-gap" />}

      {/* Toolbar Filter & Search */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="search" style={{ flex: 1, minWidth: 260 }}>
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Rechercher par référence, nom ou unité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn ${statusFilter === 'ALL' ? 'primary' : ''}`}
            onClick={() => setStatusFilter('ALL')}
            style={{ minHeight: 38, fontSize: 12 }}
          >
            Toutes ({matieres.length})
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'LOW' ? 'primary' : ''}`}
            onClick={() => setStatusFilter('LOW')}
            style={{ minHeight: 38, fontSize: 12 }}
          >
            Stock bas
          </button>
          <button
            type="button"
            className={`btn ${statusFilter === 'OK' ? 'primary' : ''}`}
            onClick={() => setStatusFilter('OK')}
            style={{ minHeight: 38, fontSize: 12 }}
          >
            Disponibles
          </button>
        </div>
      </div>

      {/* Materials Table */}
      <section className="panel" style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>RÉFÉRENCE & NOM</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>STOCK DISPONIBLE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>SEUIL D'ALERTE</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)' }}>STATUT</th>
                <th style={{ padding: '12px 20px', fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>
                    <span className="spinner"></span> Chargement des matières premières...
                  </td>
                </tr>
              ) : filteredMatieres.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucune matière première trouvée.
                  </td>
                </tr>
              ) : (
                filteredMatieres.map((m) => {
                  const stock = stocksMap[m._id] ?? 0;
                  const isLow = stock <= m.seuilAlerte;
                  return (
                    <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <strong style={{ fontSize: 14 }}>{m.nom}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          Réf: <code>{m.reference}</code>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <strong className="tabular" style={{ fontSize: 15, color: isLow ? 'var(--red-ink)' : 'var(--navy)' }}>
                          {stock} {m.unite}
                        </strong>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--slate)' }}>
                        {m.seuilAlerte} {m.unite}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Badge
                          status={isLow ? 'LOW' : 'OK'}
                          label={isLow ? 'Stock critique' : 'Disponible'}
                        />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ minHeight: 32, padding: '4px 8px' }}
                            onClick={() => openEditModal(m)}
                            title="Modifier"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ minHeight: 32, padding: '4px 8px', color: 'var(--red-ink)' }}
                            onClick={() => setDeletingMatiere(m)}
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

      {/* Modal Form: Create / Edit Material */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMatiere ? 'Modifier la matière première' : 'Nouvelle matière première'}
        subtitle="Renseignez les caractéristiques techniques et le seuil d'alerte."
        iconName="layers"
        maxWidth={500}
      >
        <form onSubmit={handleFormSubmit}>
          {formError && <Notice tone="error" title="Erreur" message={formError} className="section-gap" />}

          <div className="field">
            <label htmlFor="mat-ref">
              Référence unique <span className="required">*</span>
            </label>
            <input
              id="mat-ref"
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="field">
            <label htmlFor="mat-nom">
              Nom de la matière <span className="required">*</span>
            </label>
            <input
              id="mat-nom"
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="ex: Acier allié, Résine polymère..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label htmlFor="mat-unite">
                Unité de mesure <span className="required">*</span>
              </label>
              <select
                id="mat-unite"
                value={formData.unite}
                onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                required
                disabled={isSubmitting}
              >
                <option value="kg">kg (Kilogrammes)</option>
                <option value="L">L (Litres)</option>
                <option value="unite">unite (Pièces)</option>
                <option value="m">m (Mètres)</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="mat-seuil">
                Seuil d'alerte <span className="required">*</span>
              </label>
              <input
                id="mat-seuil"
                type="number"
                min="0"
                step="any"
                value={formData.seuilAlerte}
                onChange={(e) => setFormData({ ...formData, seuilAlerte: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
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
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete Material */}
      <Modal
        isOpen={Boolean(deletingMatiere)}
        onClose={() => setDeletingMatiere(null)}
        title="Confirmer la suppression"
        subtitle={`Voulez-vous vraiment supprimer la matière ${deletingMatiere?.nom} (${deletingMatiere?.reference}) ?`}
        iconName="alert"
        isDanger={true}
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setDeletingMatiere(null)}
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
