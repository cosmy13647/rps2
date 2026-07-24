import api from './api';

export const getUnpaidReceipts = () => {
    return api.get('/api/receipts');
};

export const payReceipt = (id, data) => {
    return api.patch(`/api/receipts/${id}/pay`, data);
};
export const getReceiptsByWaiter = (name) => {
    return api.get(`/api/receipts/waiter/${name}`);
};
export const sendStk = (receiptId, phone) =>
    api.post(`/api/receipts/${receiptId}/send-stk`, { phone });