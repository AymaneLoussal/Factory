import apiClient from './client';

export const compositionService = {
  async findByProduct(produitId) {
    const response = await apiClient.get(`/produits/${produitId}/compositions`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post('/compositions', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.patch(`/compositions/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/compositions/${id}`);
    return response.data;
  },
};

export default compositionService;
