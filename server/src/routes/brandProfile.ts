import { Router, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { parseBrandDescription } from '../openai.js';

const router = Router();

// All brand profile routes require auth
router.use(authMiddleware);

// POST /api/brand-profile/parse — parse a description into structured brand profile
router.post('/parse', async (req: AuthRequest, res: Response) => {
  try {
    const { description, extraContext, tonePreference } = req.body;

    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const parsed = await parseBrandDescription(
      description,
      extraContext || '',
      tonePreference || ''
    );

    res.json({ profile: parsed });
  } catch (err) {
    console.error('Brand profile parse error:', err);
    res.status(500).json({ error: 'Failed to parse brand description' });
  }
});

// GET /api/brand-profile — retrieve the user's brand profile
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, user_id, raw_description, business_name, niche, audience, tone, tone_of_voice,
              goals, offers, key_offers, created_at, updated_at
       FROM brand_profiles WHERE user_id = ?`,
      [req.userId!]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      res.json({ profile: null });
      return;
    }

    const row = result[0].values[0];
    const profile = {
      id: row[0],
      user_id: row[1],
      raw_description: row[2],
      business_name: row[3],
      niche: row[4],
      audience: row[5],
      tone: row[6],
      tone_of_voice: row[7],
      goals: row[8],
      offers: row[9],
      key_offers: row[10],
      created_at: row[11],
      updated_at: row[12],
    };

    res.json({ profile });
  } catch (err) {
    console.error('Get brand profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve brand profile' });
  }
});

// POST /api/brand-profile — save or update brand profile
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { raw_description, niche, audience, tone_of_voice, goals, key_offers } = req.body;

    if (!niche && !audience && !tone_of_voice) {
      res.status(400).json({ error: 'At minimum, niche, audience, or tone_of_voice must be provided' });
      return;
    }

    const db = await getDb();

    // Check if user already has a profile
    const existing = db.exec('SELECT id FROM brand_profiles WHERE user_id = ?', [req.userId!]);
    const hasProfile = existing.length > 0 && existing[0].values.length > 0;

    if (hasProfile) {
      db.run(
        `UPDATE brand_profiles
         SET raw_description = ?, niche = ?, audience = ?, tone_of_voice = ?, goals = ?, key_offers = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
        [
          raw_description || null,
          niche || null,
          audience || null,
          tone_of_voice || null,
          goals || null,
          key_offers || null,
          req.userId!,
        ]
      );
    } else {
      db.run(
        `INSERT INTO brand_profiles (user_id, raw_description, niche, audience, tone_of_voice, goals, key_offers)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.userId!,
          raw_description || null,
          niche || null,
          audience || null,
          tone_of_voice || null,
          goals || null,
          key_offers || null,
        ]
      );
    }

    saveDb();

    res.json({ success: true });
  } catch (err) {
    console.error('Save brand profile error:', err);
    res.status(500).json({ error: 'Failed to save brand profile' });
  }
});

export default router;
