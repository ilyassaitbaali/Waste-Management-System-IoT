// routes/regions.js - Regions CRUD
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET /api/regions - Get all regions
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Regions ORDER BY name_region');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/regions/:id - Get one region
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM Regions WHERE ID_Region = ?', 
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Region not found.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/regions - Create region (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
    const { name_region } = req.body;
    if (!name_region) {
        return res.status(400).json({ success: false, message: 'Region name is required.' });
    }
    try {
        const id = 'reg-' + Date.now();
        await db.execute(
            'INSERT INTO Regions (ID_Region, name_region) VALUES (?, ?)',
            [id, name_region]
        );
        res.status(201).json({ success: true, message: 'Region created.', id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/regions/:id - Update region (admin only)
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    const { name_region } = req.body;
    try {
        await db.execute(
            'UPDATE Regions SET name_region = ? WHERE ID_Region = ?',
            [name_region, req.params.id]
        );
        res.json({ success: true, message: 'Region updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/regions/:id - Delete region (admin only)
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        await db.execute('DELETE FROM Regions WHERE ID_Region = ?', [req.params.id]);
        res.json({ success: true, message: 'Region deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
