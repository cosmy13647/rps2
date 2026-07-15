const { Server } = require('socket.io');

let io;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || origin.endsWith('.vercel.app') || origin === 'http://localhost:5173') {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST", "PATCH", "DELETE"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`socket connected: ${socket.id}`);

        // Client sends their role on connect so we can route notifications
        socket.on('join:role', (role) => {
            if (!role) return;
            socket.join(role); // e.g. 'cashier', 'waiter', 'kitchen', 'manager'
            console.log(`${socket.id} joined room: ${role}`);
        });

        socket.on('disconnect', () => {
            console.log(`socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};

// Notification routing — called when kitchen marks order as ready
const notifyOrderReady = (order) => {
    const payload = {
        order_id: order.id,
        table_number: order.table_number,
        waiter_name: order.waiter_name,
        order_type: order.order_type,
        status: 'ready',
        timestamp: new Date().toISOString()
    };

    if (order.order_type === 'table') {
        // Notify waiters room only
        io.to('waiter').emit('order:ready', payload);
    } else {
        // Take away or delivery — notify cashiers
        io.to('cashier').emit('order:ready', payload);
    }
};

module.exports = { init, getIO, notifyOrderReady };