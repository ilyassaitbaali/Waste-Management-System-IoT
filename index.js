// index.js - Main server file
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/regions',    require('./routes/regions'));
app.use('/api/containers', require('./routes/containers'));
app.use('/api/sensorData', require('./routes/sensorData'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/analytics',  require('./routes/analytics'));

// Health check
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: '🗑️ Smart Waste Management API is running!',
        version: '1.0.0',
        endpoints: {
            auth:       'POST /api/auth/login',
            regions:    'GET  /api/regions',
            containers: 'GET  /api/containers',
            sensorData: 'POST /api/sensorData',
            employees:  'GET  /api/employees',
            analytics:  'GET  /api/analytics/summary'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.url} not found.` });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('');
    console.log('🗑️  Smart Waste Management System');
    console.log('================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('📡 Available API endpoints:');
    console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET    http://localhost:${PORT}/api/regions`);
    console.log(`   GET    http://localhost:${PORT}/api/containers`);
    console.log(`   POST   http://localhost:${PORT}/api/sensorData`);
    console.log(`   GET    http://localhost:${PORT}/api/employees`);
    console.log(`   GET    http://localhost:${PORT}/api/analytics/summary`);
    console.log('');
});
