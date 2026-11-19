import apiClient from './client';

export const produitService = {
  async getAll() {
    const response = await apiClient.get('/produits');
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/produits/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/produits', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.patch(`/produits/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/produits/${id}`);
    return response.data;
  },
};

export default produitService;
