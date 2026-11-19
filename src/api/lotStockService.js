import apiClient from './client';

export const lotStockService = {
  async getAllLots() {
    const response = await apiClient.get('/lots');
    return response.data;
  },

  async getLotById(id) {
    const response = await apiClient.get(`/lots/${id}`);
    return response.data;
  },

  async enregistrerEntree(data) {
    const response = await apiClient.post('/lots', data);
    return response.data;
  },

  async ajusterLot(id, data) {
    const response = await apiClient.patch(`/lots/${id}/ajuster`, data);
    return response.data;
  },
};

export default lotStockService;
