import posApi from './posApi';

export const createOrder = async (orderData) => {
    const response = await posApi.post('/orders', orderData);
    return response.data;
};
