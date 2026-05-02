// routes/sensorData.js - Sensor data endpoints
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// POST /api/sensorData - Receive data from Arduino/Python simulator
// This endpoint is called by the Python gateway (no token needed for IoT device)
router.post('/', async (req, res) => {
    const { sensor_id, s1_r, s1_o, s2_r, s2_o, s3_r, s3_o, position } = req.body;

    if (!sensor_id) {
        return res.status(400).json({ success: false, message: 'sensor_id (container ID) is required.' });
    }

    try {
        // Check container exists
        const [containers] = await db.execute(
            'SELECT ID_Container FROM Containers WHERE ID_Container = ?',
            [sensor_id]
        );

        if (containers.length === 0) {
            return res.status(404).json({ success: false, message: 'Container not found.' });
        }

        // Insert sensor reading
        const id = 'rec-' + Date.now();
        await db.execute(
            `INSERT INTO SensorData 
             (ID_Record, ID_Container, s1_r, s1_o, s2_r, s2_o, s3_r, s3_o, position) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, sensor_id, s1_r || 0, s1_o || 0, s2_r || 0, s2_o || 0, s3_r || 0, s3_o || 0, position || 0]
        );

        // If position = 180 (full scan done), trigger will auto-calculate fill level
        const message = position === 180 
            ? 'Full scan received. Fill level calculated.' 
            : `Reading at position ${position}° received.`;

        res.status(201).json({ 
            success: true, 
            message,
            record_id: id
        });

    } catch (err) {
        console.error('SensorData insert error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/sensorData - Get all sensor data (protected)
router.get('/', verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const [rows] = await db.execute(
            'SELECT * FROM SensorData ORDER BY timestamp DESC LIMIT ?',
            [limit]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/sensorData/container/:id - Get sensor data for a container
router.get('/container/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM SensorData WHERE ID_Container = ? ORDER BY timestamp DESC LIMIT 50',
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
