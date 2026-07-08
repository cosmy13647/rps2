import api from './api';

export const createOrder = (data) => {
    return api.post('/api/orders', data);
};

// Orders the kitchen still needs to prepare (not yet marked done)
export const getPendingOrders = () => {
    return api.get('/api/orders/pending');
};

// Update an order's status, e.g. 'pending' -> 'done'
export const updateOrderStatus = (orderId, status) => {
    return api.patch(`/api/orders/${orderId}/status`, { status });
};
