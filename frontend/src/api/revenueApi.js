import posApi from './posApi';

export const getTodayRevenue = async () => {
    const response = await posApi.get('/revenue/today');
    return response.data;
};
