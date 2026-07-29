import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const db = await getDb();

    // Check if user already exists
    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [
      email.toLowerCase().trim(),
      passwordHash,
    ]);

    // Get the new user's ID
    const result = db.exec('SELECT last_insert_rowid() as id');
    const userId = result[0].values[0][0] as number;

    saveDb();

    const token = generateToken(userId);

    res.status(201).json({
      token,
      user: { id: userId, email: email.toLowerCase().trim() },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = await getDb();
    const result = db.exec('SELECT id, email, password_hash FROM users WHERE email = ?', [
      email.toLowerCase().trim(),
    ]);

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const [id, userEmail, passwordHash] = result[0].values[0] as [number, string, string];

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(id);

    res.json({
      token,
      user: { id, email: userEmail },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, email, created_at FROM users WHERE id = ?', [req.userId!]);

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [id, email, createdAt] = result[0].values[0];
    res.json({ user: { id, email, created_at: createdAt } });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
