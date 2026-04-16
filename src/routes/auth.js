import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

const router = Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email en wachtwoord verplicht' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Onjuiste inloggegevens' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/register (alleen intern gebruik)
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email en wachtwoord verplicht' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hash, name || null]
    );
    res.status(201).json({ id: result.insertId, email });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email bestaat al' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
