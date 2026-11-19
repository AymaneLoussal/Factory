import apiClient from './client';

export const authService = {
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data;
  },

  async checkHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  async checkInstallationStatus() {
    const response = await apiClient.get('/auth/setup-status');
    return response.data;
  },

  async setupInitialAdmin(data) {
    const response = await apiClient.post('/auth/setup-admin', data);
    return response.data;
  },
};

export default authService;
