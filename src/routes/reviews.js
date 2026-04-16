import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /reviews — review inbox
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, p.domain
       FROM reviews r
       LEFT JOIN projects p ON r.project_id = p.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews/:id/approve
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE reviews SET status='approved', reviewed_at=NOW() WHERE id=?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews/:id/reject
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE reviews SET status='rejected', reviewed_at=NOW() WHERE id=?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews — nieuwe review aanmaken (intern, door agents)
router.post('/', requireAuth, async (req, res) => {
  const { project_id, agent_run_id, type, title, body } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO reviews (project_id, agent_run_id, type, title, body) VALUES (?, ?, ?, ?, ?)',
      [project_id || null, agent_run_id || null, type, title, body]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
