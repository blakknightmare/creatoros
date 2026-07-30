import { Response, NextFunction } from 'express';
import { getDb, saveDb } from '../db.js';
import { AuthRequest } from './auth.js';

const FREE_TIER_LIMIT = 10;

export interface UsageInfo {
  tier: string;
  dailyCount: number;
  dailyLimit: number;
  isLimited: boolean;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getUserUsage(userId: number): Promise<UsageInfo> {
  const db = await getDb();
  const result = db.exec(
    `SELECT tier, daily_generation_count, daily_generation_date FROM users WHERE id = ?`,
    [userId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return { tier: 'free', dailyCount: 0, dailyLimit: FREE_TIER_LIMIT, isLimited: true };
  }

  const [tier, count, date] = result[0].values[0] as [string, number, string | null];
  const today = getTodayDateString();

  // Reset count if it's a new day
  const effectiveCount = date === today ? (count || 0) : 0;
  const isLimited = tier === 'free';
  const dailyLimit = isLimited ? FREE_TIER_LIMIT : Infinity;

  return { tier, dailyCount: effectiveCount, dailyLimit, isLimited };
}

/**
 * Check usage limit before generation.
 * Increments the counter after the check passes.
 */
export async function checkUsageLimit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const usage = await getUserUsage(userId);

    if (usage.isLimited && usage.dailyCount >= FREE_TIER_LIMIT) {
      res.status(429).json({
        error: 'daily_limit_reached',
        limit: FREE_TIER_LIMIT,
        tier: usage.tier,
        upgrade_url: '/pricing',
      });
      return;
    }

    next();
  } catch (err) {
    console.error('Usage check error:', err);
    // On error, allow the request through (don't block legitimate users)
    next();
  }
}

/**
 * Increment the user's daily generation count.
 * Call this after a successful generation.
 */
export async function incrementUsage(userId: number): Promise<void> {
  try {
    const db = await getDb();
    const today = getTodayDateString();

    // Get current count and date
    const result = db.exec(
      `SELECT daily_generation_count, daily_generation_date FROM users WHERE id = ?`,
      [userId]
    );

    if (result.length === 0 || result[0].values.length === 0) return;

    const [count, date] = result[0].values[0] as [number, string | null];

    if (date === today) {
      // Same day — increment
      db.run(
        `UPDATE users SET daily_generation_count = ? WHERE id = ?`,
        [(count || 0) + 1, userId]
      );
    } else {
      // New day — reset to 1
      db.run(
        `UPDATE users SET daily_generation_count = 1, daily_generation_date = ? WHERE id = ?`,
        [today, userId]
      );
    }

    saveDb();
  } catch (err) {
    console.error('Usage increment error:', err);
  }
}
