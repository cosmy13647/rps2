import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket;

export const connectSocket = (role) => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        socket.emit('join:role', role);
    });

    return socket;
};

export const getSocket = () => socket;