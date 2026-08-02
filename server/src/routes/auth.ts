import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, saveDb } from '../db.js';
import { generateToken, verifyToken, authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendEmail } from '../email.js';

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

    // Send welcome email (non-blocking — don't fail signup if email fails)
    const userEmail = email.toLowerCase().trim();
    sendEmail(userEmail, 'Welcome to KREO!', 
      `Welcome to KREO!\n\n` +
      `Hi there,\n\n` +
      `Thanks for creating an account! With KREO you can:\n` +
      `• Generate on-brand content for TikTok, LinkedIn, X, blogs, and more\n` +
      `• Store your brand profile once — never re-explain your business to AI again\n` +
      `• Save projects, schedule posts on a calendar, and track your analytics\n\n` +
      `Get started by completing your brand setup, then head to the Generate page to create your first piece of content.\n\n` +
      `— The KREO Team\n`
    ).catch(() => {}); // Fire-and-forget

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
    const result = db.exec('SELECT id, email, created_at, tier FROM users WHERE id = ?', [req.userId!]);

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [id, email, createdAt, tier] = result[0].values[0];

    // Check if user has a brand profile
    const profileResult = db.exec('SELECT id FROM brand_profiles WHERE user_id = ?', [req.userId!]);
    const hasBrandProfile = profileResult.length > 0 && profileResult[0].values.length > 0;

    res.json({ user: { id, email, created_at: createdAt, has_brand_profile: hasBrandProfile, tier: tier || 'free' } });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const db = await getDb();
    const result = db.exec('SELECT id FROM users WHERE email = ?', [
      email.toLowerCase().trim(),
    ]);

    // Always return the same response — don't leak whether the account exists
    if (result.length === 0 || result[0].values.length === 0) {
      res.json({ message: 'If an account exists, a reset link has been sent' });
      return;
    }

    const [userId] = result[0].values[0] as [number];

    // Generate a short-lived JWT (1 hour)
    const resetToken = generateToken(userId, '1h');

    // Hash the token before storing
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Expiry timestamp (1 hour from now, ISO format)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.run(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
    saveDb();

    const resetLink = `https://creatoros.ctonew.app/reset-password?token=${encodeURIComponent(resetToken)}`;
    const emailBody = 
      `Hi there,\n\n` +
      `We received a request to reset your KREO password. Click the link below to set a new password:\n\n` +
      `${resetLink}\n\n` +
      `This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.\n\n` +
      `— The KREO Team\n`;

    // Fire-and-forget — don't fail the request if email sending fails
    sendEmail(email.toLowerCase().trim(), 'Reset your KREO password', emailBody).catch(() => {});

    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.json({ message: 'If an account exists, a reset link has been sent' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Verify the JWT
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const db = await getDb();

    // Hash the token to look up in DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find a valid (unused, non-expired) token
    const tokenResult = db.exec(
      `SELECT id, user_id, expires_at, used FROM password_reset_tokens 
       WHERE token_hash = ? AND user_id = ? AND used = 0`,
      [tokenHash, decoded.userId]
    );

    if (tokenResult.length === 0 || tokenResult[0].values.length === 0) {
      res.status(400).json({ error: 'Invalid or already used reset token' });
      return;
    }

    const [tokenId, userId, expiresAt, used] = tokenResult[0].values[0] as [number, number, string, number];

    // Check expiry (belt-and-suspenders — JWT also has expiry)
    if (new Date(expiresAt) < new Date()) {
      res.status(400).json({ error: 'Reset token has expired' });
      return;
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user's password
    db.run('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?', [
      passwordHash,
      userId,
    ]);

    // Mark token as used
    db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenId]);

    saveDb();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
