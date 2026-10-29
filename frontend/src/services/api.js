import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format errors nicely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export const InventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }).then((res) => res.data),
  getById: (id) => api.get(`/inventory/${id}`).then((res) => res.data),
  create: (data) => api.post('/inventory', data).then((res) => res.data),
  update: (id, data) => api.put(`/inventory/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/inventory/${id}`).then((res) => res.data),
};

export const SuppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }).then((res) => res.data),
  getById: (id) => api.get(`/suppliers/${id}`).then((res) => res.data),
  create: (data) => api.post('/suppliers', data).then((res) => res.data),
  update: (id, data) => api.put(`/suppliers/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/suppliers/${id}`).then((res) => res.data),
};

export const MovementsAPI = {
  getAll: (params) => api.get('/stock-movements', { params }).then((res) => res.data),
  record: (data) => api.post('/stock-movements', data).then((res) => res.data),
};

export const ReportsAPI = {
  getCategorySummary: () => api.get('/reports/category-summary').then((res) => res.data),
  getInventoryValue: () => api.get('/reports/inventory-value').then((res) => res.data),
  getLowStock: () => api.get('/reports/low-stock').then((res) => res.data),
  getExpired: () => api.get('/reports/expired').then((res) => res.data),
  getSupplierSummary: () => api.get('/reports/supplier-summary').then((res) => res.data),
  getTopExpensive: () => api.get('/reports/top-expensive').then((res) => res.data),
  getMovementSummary: () => api.get('/reports/movement-summary').then((res) => res.data),
  getMonthlyTrends: () => api.get('/reports/monthly-trends').then((res) => res.data),
};

export const DashboardAPI = {
  getStats: () => api.get('/dashboard/stats').then((res) => res.data),
  getRecentMovements: () => api.get('/dashboard/recent-movements').then((res) => res.data),
  getAlerts: () => api.get('/dashboard/alerts').then((res) => res.data),
};

export default api;
