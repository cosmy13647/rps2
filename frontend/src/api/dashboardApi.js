import api from './api';

export const getDashboardSummary = () => api.get('/api/dashboard/summary');
export const getTodayRevenue = () => api.get('/api/revenue/today');
export const getRecentReceipts = (limit = 10) =>
    api.get(`/api/receipts/recent?limit=${limit}`);
export const getRecentOrders = (limit = 10) =>
    api.get(`/api/orders/recent?limit=${limit}`);
