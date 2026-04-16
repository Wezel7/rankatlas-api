import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /keywords?project_id=1
router.get('/', requireAuth, async (req, res) => {
  const { project_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM keywords
       WHERE project_id = ?
       ORDER BY position ASC, tracked_at DESC`,
      [project_id || 1]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /keywords — keyword toevoegen of updaten
router.post('/', requireAuth, async (req, res) => {
  const { project_id, keyword, position, volume, difficulty, url } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO keywords (project_id, keyword, position, volume, difficulty, url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE position=VALUES(position), tracked_at=NOW()`,
      [project_id, keyword, position, volume, difficulty, url]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /keywords/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM keywords WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
