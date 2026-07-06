import api from './api';

export const getUnpaidReceipts = () => {
    return api.get('/api/receipts');
};

export const payReceipt = (id, data) => {
    return api.patch(`/api/receipts/${id}/pay`, data);
};