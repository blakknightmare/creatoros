import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';

const router = Router();

type StripeEvent = {
  type?: unknown;
  data?: {
    object?: Record<string, unknown>;
  };
};

/**
 * Stripe webhook receiver.
 *
 * This endpoint is intentionally unauthenticated: Stripe calls it directly.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  // Stripe requires a 2xx response even when an event cannot be processed.
  try {
    const event = req.body as StripeEvent | undefined;
    const eventType = typeof event?.type === 'string' ? event.type : undefined;
    const object = event?.data?.object;

    if (!eventType || !object || typeof object !== 'object') {
      console.error('Stripe webhook event is missing type or data.object');
      res.status(200).json({ received: true });
      return;
    }

    // TODO: Verify the Stripe-Signature header with the managed webhook secret
    // once the platform makes that secret available.

    const customerDetails = object.customer_details;
    const detailsEmail =
      customerDetails && typeof customerDetails === 'object'
        ? (customerDetails as { email?: unknown }).email
        : undefined;
    const email = [detailsEmail, object.customer_email, object.email].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );

    if (eventType === 'checkout.session.completed') {
      if (!email) {
        console.error('Stripe checkout event has no customer email');
      } else {
        const amountTotal = object.amount_total;
        const tier = amountTotal === 1900 ? 'pro' : amountTotal === 7900 ? 'agency' : undefined;

        if (!tier) {
          console.error(`Stripe checkout has unsupported amount_total: ${String(amountTotal)}`);
        } else {
          const db = await getDb();
          const result = db.exec('SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1', [email.trim()]);

          if (result.length === 0 || result[0].values.length === 0) {
            console.error(`Stripe checkout user not found for email: ${email}`);
          } else {
            db.run("UPDATE users SET tier = ?, updated_at = datetime('now') WHERE lower(email) = lower(?)", [
              tier,
              email.trim(),
            ]);
            saveDb();
            console.log(`Stripe checkout upgraded ${email} to ${tier}`);
          }
        }
      }
    } else if (eventType === 'customer.subscription.deleted') {
      if (!email) {
        console.error('Stripe subscription deletion event has no customer email');
      } else {
        const db = await getDb();
        const result = db.exec('SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1', [email.trim()]);

        if (result.length === 0 || result[0].values.length === 0) {
          console.error(`Stripe subscription user not found for email: ${email}`);
        } else {
          db.run("UPDATE users SET tier = 'free', updated_at = datetime('now') WHERE lower(email) = lower(?)", [
            email.trim(),
          ]);
          saveDb();
          console.log(`Stripe subscription downgraded ${email} to free`);
        }
      }
    }
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
  }

  res.status(200).json({ received: true });
});

export default router;
