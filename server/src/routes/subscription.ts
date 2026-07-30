import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getUserUsage } from '../middleware/usage.js';

const router = Router();

router.use(authMiddleware);

// Stripe payment links
const STRIPE_LINKS = {
  pro: 'https://buy.stripe.com/6oU7sN2Xjc5lcn1aB82wU00',
  agency: 'https://buy.stripe.com/3cI28tapL3yP2Mr9x42wU01',
};

// GET /api/subscription
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const usage = await getUserUsage(req.userId!);

    res.json({
      tier: usage.tier,
      dailyUsage: {
        count: usage.dailyCount,
        limit: usage.isLimited ? usage.dailyLimit : null,
      },
      upgradeLinks: {
        pro: STRIPE_LINKS.pro,
        agency: STRIPE_LINKS.agency,
      },
    });
  } catch (err) {
    console.error('Subscription fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription info' });
  }
});

// POST /api/subscription/upgrade
router.post('/upgrade', async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;
    const usage = await getUserUsage(req.userId!);

    if (!tier || !['pro', 'agency'].includes(tier)) {
      res.status(400).json({
        error: 'Invalid tier. Must be "pro" or "agency".',
        availableTiers: ['pro', 'agency'],
      });
      return;
    }

    // Don't allow downgrade
    if (usage.tier === tier) {
      res.json({
        message: `You are already on the ${tier} tier.`,
        tier: usage.tier,
      });
      return;
    }

    if (usage.tier === 'agency') {
      res.json({
        message: 'You are already on the Agency tier — no upgrade needed.',
        tier: usage.tier,
      });
      return;
    }

    // Return the appropriate Stripe payment link
    const paymentLink = STRIPE_LINKS[tier as keyof typeof STRIPE_LINKS];

    res.json({
      message: `Redirecting to Stripe checkout for ${tier} plan...`,
      tier: usage.tier,
      upgradeTo: tier,
      paymentLink,
    });
  } catch (err) {
    console.error('Subscription upgrade error:', err);
    res.status(500).json({ error: 'Failed to process upgrade request' });
  }
});

export default router;
