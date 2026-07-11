import api from './api';

export const openShift = (opening_float) => {
    return api.post('/api/shifts/open', { opening_float });
};

export const getCurrentShift = () => {
    return api.get('/api/shifts/current');
};

export const addPettyCash = (shiftId, amount, reason) => {
    return api.post(`/api/shifts/${shiftId}/petty-cash`, { amount, reason });
};

export const getShiftSummary = (shiftId) => {
    return api.get(`/api/shifts/${shiftId}/summary`);
};

export const closeShift = (shiftId, { closing_cash_count, tips_declared, notes }) => {
    return api.post(`/api/shifts/${shiftId}/close`, { closing_cash_count, tips_declared, notes });
};