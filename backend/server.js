const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();


const app = express();
const http = require('http');
const { init } = require('./src/config/socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
init(server);

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://rps2-three.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());



// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// Test Routes
const testRoutes = require('./src/routes/testRoutes');
app.use('/api/test', testRoutes);

// Receipt Routes
const receiptRoutes = require('./src/routes/receiptRoutes');
app.use('/api/receipts', receiptRoutes);

// Order Routes
const orderRoutes = require('./src/routes/orderRoutes');
app.use('/api/orders', orderRoutes);

// Revenue Routes
const revenueRoutes = require('./src/routes/revenueRoutes');
app.use('/api/revenue', revenueRoutes);

// Void Request Routes
const voidRequestRoutes = require('./src/routes/voidRequestRoutes');
app.use('/api/void-requests', voidRequestRoutes);

// Menu Routes
const menuRoutes = require('./src/routes/menuRoutes');
app.use('/api/menu', menuRoutes);

// Auth Routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);


// Shift Routes
const shiftRoutes = require('./src/routes/shiftRoutes');
app.use('/api/shifts', shiftRoutes);

const dashboardRoutes = require('./src/routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});