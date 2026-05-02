// routes/employees.js - Employee management (admin only)
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET /api/employees - Get all employees
router.get('/', verifyToken, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT ID_Employee, name, email, role, created_at FROM Companie ORDER BY name'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/employees - Add new employee (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    try {
        // Check if email already exists
        const [existing] = await db.execute(
            'SELECT ID_Employee FROM Companie WHERE email = ?', [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already in use.' });
        }

        const id = 'emp-' + Date.now();
        await db.execute(
            'INSERT INTO Companie (ID_Employee, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, password, role || 'employee']
        );
        res.status(201).json({ success: true, message: 'Employee created.', id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/employees/:id - Update employee (admin only)
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
    const { name, email, role } = req.body;
    try {
        await db.execute(
            'UPDATE Companie SET name=?, email=?, role=? WHERE ID_Employee=?',
            [name, email, role, req.params.id]
        );
        res.json({ success: true, message: 'Employee updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/employees/:id - Delete employee (admin only)
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        await db.execute('DELETE FROM Companie WHERE ID_Employee = ?', [req.params.id]);
        res.json({ success: true, message: 'Employee deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
