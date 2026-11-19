import apiClient from './client.js';

export const ordreService = {
  async getAll(params = {}) {
    const response = await apiClient.get('/ordres', { params });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/ordres/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/ordres', data);
    return response.data;
  },

  async demarrer(id) {
    const response = await apiClient.post(`/ordres/${id}/demarrer`);
    return response.data;
  },

  async terminer(id) {
    const response = await apiClient.post(`/ordres/${id}/terminer`);
    return response.data;
  },

  async annuler(id) {
    const response = await apiClient.post(`/ordres/${id}/annuler`);
    return response.data;
  },

  /**
   * Calcule les besoins cumulés en matières premières pour un ensemble de produits et quantités.
   * @param {Array<{ produitId: string, quantite: number }>} items Lignes de produits commandés
   * @param {Record<string, Array<{ matiere: any, quantiteUnitaire: number }>>} compositionsMap Dictionnaire des nomenclatures par produit
   * @returns {Array<{ matiereId: string, reference: string, nom: string, unite: string, quantiteTotale: number, seuilAlerte: number }>}
   */
  calculateAggregatedRequirements(items, compositionsMap) {
    const requirementsMap = new Map();

    for (const item of items) {
      if (!item.produitId || !item.quantite || item.quantite <= 0) continue;
      const comps = compositionsMap[item.produitId] || [];

      for (const comp of comps) {
        const mat = comp.matiere;
        if (!mat) continue;
        const matId = mat._id || mat.id || String(mat);
        const needed = Number(item.quantite) * Number(comp.quantiteUnitaire);

        if (!requirementsMap.has(matId)) {
          requirementsMap.set(matId, {
            matiereId: matId,
            reference: mat.reference || matId,
            nom: mat.nom || 'Matière inconnue',
            unite: mat.unite || 'unite',
            seuilAlerte: mat.seuilAlerte || 0,
            quantiteTotale: 0,
          });
        }

        const current = requirementsMap.get(matId);
        current.quantiteTotale = Number((current.quantiteTotale + needed).toFixed(4));
      }
    }

    return Array.from(requirementsMap.values());
  },
};

export default ordreService;
