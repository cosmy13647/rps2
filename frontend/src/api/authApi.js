import api from './api';

export const login = (username, password) => {
    return api.post('/api/auth/login', { username, password });
};