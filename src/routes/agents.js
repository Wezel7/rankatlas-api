import { Router } from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { runAgent } from '../services/claude.js';

const router = Router();

// GET /agents — alle agents met status
router.get('/', requireAuth, async (req, res) => {
  try {
    const [agents] = await db.query(
      'SELECT id, slug, name, category, icon, status, last_run, last_action FROM agents ORDER BY id'
    );
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /agents/:slug — één agent
router.get('/:slug', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM agents WHERE slug = ?', [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Agent niet gevonden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /agents/:slug/run — agent uitvoeren
router.post('/:slug/run', requireAuth, async (req, res) => {
  const { slug } = req.params;
  const { prompt, project_id } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Prompt verplicht' });

  try {
    // Agent ophalen
    const [rows] = await db.query('SELECT * FROM agents WHERE slug = ?', [slug]);
    const agent = rows[0];
    if (!agent) return res.status(404).json({ error: 'Agent niet gevonden' });

    // Run aanmaken
    const [run] = await db.query(
      'INSERT INTO agent_runs (agent_id, project_id, user_id, prompt, status) VALUES (?, ?, ?, ?, ?)',
      [agent.id, project_id || null, req.user.id, prompt, 'running']
    );
    const runId = run.insertId;

    // Status agent op 'running' zetten
    await db.query("UPDATE agents SET status = 'running' WHERE id = ?", [agent.id]);

    // Asynchroon uitvoeren (niet awaiten — geeft meteen runId terug)
    runAgent(slug, prompt, runId).then(async ({ result, tokens_in, tokens_out }) => {
      await db.query(
        `UPDATE agent_runs SET status='done', result=?, tokens_in=?, tokens_out=?, finished_at=NOW() WHERE id=?`,
        [result, tokens_in, tokens_out, runId]
      );
      await db.query(
        "UPDATE agents SET status='done', last_run=NOW(), last_action=? WHERE id=?",
        [result.substring(0, 200), agent.id]
      );
    }).catch(async (err) => {
      await db.query(
        "UPDATE agent_runs SET status='error', result=?, finished_at=NOW() WHERE id=?",
        [err.message, runId]
      );
      await db.query(
        "UPDATE agents SET status='error' WHERE id=?", [agent.id]
      );
    });

    res.status(202).json({ run_id: runId, status: 'running' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /agents/runs/:runId — status van een run
router.get('/runs/:runId', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, a.name as agent_name, a.slug
       FROM agent_runs r
       JOIN agents a ON r.agent_id = a.id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.runId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Run niet gevonden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /agents/:slug/history — recente runs van een agent
router.get('/:slug/history', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.prompt, r.status, r.tokens_in, r.tokens_out, r.started_at, r.finished_at
       FROM agent_runs r
       JOIN agents a ON r.agent_id = a.id
       WHERE a.slug = ? AND r.user_id = ?
       ORDER BY r.started_at DESC LIMIT 20`,
      [req.params.slug, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
