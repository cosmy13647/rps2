const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO with an HTTP server
 * @param {object} server - The HTTP server instance
 * @returns {object} The Socket.IO server instance
 */
const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST", "PATCH", "DELETE"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`socket connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Get the initialized Socket.IO instance
 * @returns {object} The Socket.IO server instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    init,
    getIO
};
