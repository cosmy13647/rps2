import api from './api';

export const createOrder = (data) => {
    return api.post('/api/orders', data);
};