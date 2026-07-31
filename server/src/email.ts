import { getDb, saveDb } from './db.js';

/**
 * Send an email. Currently logs to console and saves to sent_emails table.
 * Structured so a real email provider (SendGrid, SES, etc.) can be swapped in
 * by replacing the body of this function.
 *
 * @returns true if the email was "sent" (logged+saved) successfully, false on error
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    // Log the email — placeholder for real SMTP/API integration
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);
    console.log(`[EMAIL] ---`);

    // Persist to sent_emails table for audit trail
    try {
      const db = await getDb();
      db.run('INSERT INTO sent_emails (recipient, subject, body) VALUES (?, ?, ?)', [
        to,
        subject,
        body,
      ]);
      saveDb();
    } catch (dbErr) {
      // Don't crash if the sent_emails table doesn't exist or write fails
      console.error('[EMAIL] Failed to save to sent_emails table:', dbErr);
    }

    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send email:', err);
    return false;
  }
}
