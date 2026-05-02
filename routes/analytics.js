// routes/analytics.js - Dashboard charts data
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET /api/analytics/summary - Overall system summary
router.get('/summary', verifyToken, async (req, res) => {
    try {
        // Total containers
        const [totalContainers] = await db.execute(
            'SELECT COUNT(*) AS total FROM Containers WHERE status = "active"'
        );

        // Containers by fill status
        const [statusCounts] = await db.execute(`
            SELECT 
                SUM(CASE WHEN fill_level < 33  THEN 1 ELSE 0 END) AS low,
                SUM(CASE WHEN fill_level >= 33 AND fill_level < 67 THEN 1 ELSE 0 END) AS moderate,
                SUM(CASE WHEN fill_level >= 67 THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN fill_level IS NULL THEN 1 ELSE 0 END) AS unknown
            FROM v_container_status
        `);

        // Total regions
        const [totalRegions] = await db.execute('SELECT COUNT(*) AS total FROM Regions');

        // Average fill level
        const [avgFill] = await db.execute(
            'SELECT ROUND(AVG(fill_level), 1) AS avg_fill FROM v_container_status WHERE fill_level IS NOT NULL'
        );

        res.json({
            success: true,
            data: {
                total_containers: totalContainers[0].total,
                total_regions:    totalRegions[0].total,
                avg_fill_level:   avgFill[0].avg_fill || 0,
                by_status:        statusCounts[0]
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/analytics/fill-history/:containerId - Fill level over time
router.get('/fill-history/:containerId', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                fill_level,
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i') AS time
            FROM Final_Stats
            WHERE ID_Container = ?
            ORDER BY timestamp ASC
            LIMIT 100
        `, [req.params.containerId]);

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/analytics/by-region - Average fill level per region
router.get('/by-region', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                r.name_region AS region,
                ROUND(AVG(cs.fill_level), 1) AS avg_fill,
                COUNT(cs.ID_Container) AS container_count
            FROM Regions r
            LEFT JOIN v_container_status cs ON r.name_region = cs.region
            GROUP BY r.ID_Region, r.name_region
            ORDER BY avg_fill DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/analytics/alerts - Containers that need attention (fill > 67%)
router.get('/alerts', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT * FROM v_container_status 
            WHERE fill_level >= 67
            ORDER BY fill_level DESC
        `);
        res.json({ success: true, data: rows, count: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
