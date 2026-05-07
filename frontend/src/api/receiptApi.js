import posApi from './posApi';

export const payReceipt = async (receiptId, data) => {
    const response = await posApi.patch(`/receipts/${receiptId}/pay`, data);
    return response.data;
};

export const requestVoid = async (receiptId) => {
    const response = await posApi.patch(`/receipts/${receiptId}/void-request`);
    return response.data;
};

export const markPrinted = async (receiptId) => {
    const response = await posApi.patch(`/receipts/${receiptId}/printed`);
    return response.data;
};
