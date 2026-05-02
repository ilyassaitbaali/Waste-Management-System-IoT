// routes/containers.js - Containers CRUD
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET /api/containers - Get all containers with current fill level
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM v_container_status ORDER BY region');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/containers/region/:regionId - Get containers by region
router.get('/region/:regionId', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM v_container_status WHERE ID_Container IN (SELECT ID_Container FROM Containers WHERE region_id = ?)',
            [req.params.regionId]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/containers/:id - Get one container
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM v_container_status WHERE ID_Container = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Container not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/containers/:id/history - Get fill level history
router.get('/:id/history', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT fill_level, timestamp 
             FROM Final_Stats 
             WHERE ID_Container = ? 
             ORDER BY timestamp DESC 
             LIMIT 50`,
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/containers - Add new container (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
    const { region_id, latitude, longitude, name, height_cm } = req.body;
    if (!region_id || !latitude || !longitude || !name) {
        return res.status(400).json({ success: false, message: 'region_id, latitude, longitude and name are required.' });
    }
    try {
        const id = 'con-' + Date.now();
        await db.execute(
            'INSERT INTO Containers (ID_Container, region_id, latitude, longitude, name, height_cm) VALUES (?, ?, ?, ?, ?, ?)',
            [id, region_id, latitude, longitude, name, height_cm || 20]
        );
        res.status(201).json({ success: true, message: 'Container created.', id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/containers/:id - Update container (admin only)
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    const { region_id, latitude, longitude, name, height_cm, status } = req.body;
    try {
        await db.execute(
            `UPDATE Containers 
             SET region_id=?, latitude=?, longitude=?, name=?, height_cm=?, status=?
             WHERE ID_Container=?`,
            [region_id, latitude, longitude, name, height_cm, status, req.params.id]
        );
        res.json({ success: true, message: 'Container updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/containers/:id - Delete container (admin only)
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        await db.execute('DELETE FROM Containers WHERE ID_Container = ?', [req.params.id]);
        res.json({ success: true, message: 'Container deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
