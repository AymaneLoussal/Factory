import apiClient from './client';

export const matiereService = {
  async getAll() {
    const response = await apiClient.get('/matieres');
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/matieres/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/matieres', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.patch(`/matieres/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/matieres/${id}`);
    return response.data;
  },

  async getStockDisponible(matiereId) {
    const response = await apiClient.get(`/matieres/${matiereId}/stock`);
    return response.data;
  },
};

export default matiereService;
