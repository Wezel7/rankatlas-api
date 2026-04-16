import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /metrics?project_id=1 — meest recente metrics
router.get('/', requireAuth, async (req, res) => {
  const { project_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM metrics WHERE project_id = ?
       ORDER BY recorded_at DESC LIMIT 1`,
      [project_id || 1]
    );
    res.json(rows[0] || { seo_score: 0, keywords_ranking: 0, social_reach: 0, leads: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /metrics/history?project_id=1 — historische data voor charts
router.get('/history', requireAuth, async (req, res) => {
  const { project_id, days = 30 } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM metrics
       WHERE project_id = ? AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY recorded_at ASC`,
      [project_id || 1, Number(days)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /metrics — metrics opslaan (door analytics agent)
router.post('/', requireAuth, async (req, res) => {
  const { project_id, seo_score, keywords_ranking, social_reach, leads } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO metrics (project_id, seo_score, keywords_ranking, social_reach, leads)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         seo_score=VALUES(seo_score),
         keywords_ranking=VALUES(keywords_ranking),
         social_reach=VALUES(social_reach),
         leads=VALUES(leads)`,
      [project_id, seo_score, keywords_ranking, social_reach, leads]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
