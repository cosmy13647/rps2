import api from './api';

export const placeCustomerOrder = (data) => api.post('/api/orders/customer', data);
export const getMyOrders = (sessionId) =>
  api.get(`/api/orders/customer`, { params: { session_id: sessionId } });
export const cancelMyOrder = (orderId, sessionId) =>
  api.patch(`/api/orders/customer/${orderId}/cancel`, { session_id: sessionId });
