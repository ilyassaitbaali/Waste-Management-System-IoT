// routes/auth.js - Login route
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../db');
require('dotenv').config();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required.' 
        });
    }

    try {
        // Find user by email
        const [rows] = await db.execute(
            'SELECT * FROM Companie WHERE email = ?', 
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.' 
            });
        }

        const user = rows[0];

        // Simple password check (in production use bcrypt)
        if (password !== user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.' 
            });
        }

        // Generate JWT token (valid 12 hours)
        const token = jwt.sign(
            { 
                id:    user.ID_Employee, 
                email: user.email, 
                role:  user.role,
                name:  user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id:    user.ID_Employee,
                name:  user.name,
                email: user.email,
                role:  user.role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
