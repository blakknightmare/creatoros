import { Router, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/calendar?month=YYYY-MM — return events for the given month
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { month } = req.query;

    if (!month || typeof month !== 'string') {
      res.status(400).json({ error: 'month parameter required (YYYY-MM)' });
      return;
    }

    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    // Compute end date: first day of next month
    const endYear = parseInt(mon) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endMon = parseInt(mon) === 12 ? '01' : String(parseInt(mon) + 1).padStart(2, '0');
    const endDate = `${endYear}-${endMon}-01`;

    const result = db.exec(
      `SELECT ce.id, ce.user_id, ce.project_id, ce.scheduled_date, ce.platform, ce.notes, ce.created_at,
              p.content_type, p.topic, p.generated_content
       FROM calendar_events ce
       JOIN projects p ON ce.project_id = p.id
       WHERE ce.user_id = ? AND ce.scheduled_date >= ? AND ce.scheduled_date < ?
       ORDER BY ce.scheduled_date ASC`,
      [req.userId!, startDate, endDate]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      res.json({ events: [] });
      return;
    }

    const columns = result[0].columns;
    const events = result[0].values.map((row: any[]) => {
      const event: any = {};
      columns.forEach((col: string, i: number) => {
        event[col] = row[i];
      });
      return event;
    });

    res.json({ events });
  } catch (err) {
    console.error('Calendar list error:', err);
    res.status(500).json({ error: 'Failed to list calendar events' });
  }
});

// POST /api/calendar — create a new calendar event
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { project_id, scheduled_date, platform, notes } = req.body;

    if (!project_id || !scheduled_date) {
      res.status(400).json({ error: 'project_id and scheduled_date are required' });
      return;
    }

    const db = await getDb();

    // Verify project ownership
    const check = db.exec(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [project_id, req.userId!]
    );

    if (check.length === 0 || check[0].values.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Check for existing event on same date with same project (prevent duplicates)
    const dupCheck = db.exec(
      'SELECT id FROM calendar_events WHERE user_id = ? AND project_id = ? AND scheduled_date = ?',
      [req.userId!, project_id, scheduled_date]
    );

    if (dupCheck.length > 0 && dupCheck[0].values.length > 0) {
      res.status(409).json({ error: 'This project is already scheduled for that date' });
      return;
    }

    db.run(
      `INSERT INTO calendar_events (user_id, project_id, scheduled_date, platform, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId!, project_id, scheduled_date, platform || null, notes || null]
    );
    saveDb();

    const idResult = db.exec('SELECT last_insert_rowid()');
    const eventId = idResult[0].values[0][0];

    res.status(201).json({
      event: {
        id: eventId,
        user_id: req.userId!,
        project_id,
        scheduled_date,
        platform,
        notes,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Calendar create error:', err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/calendar/:id — update event (change date, platform, notes)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const check = db.exec(
      'SELECT id, user_id FROM calendar_events WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId!]
    );

    if (check.length === 0 || check[0].values.length === 0) {
      res.status(404).json({ error: 'Calendar event not found' });
      return;
    }

    const { scheduled_date, platform, notes } = req.body;

    // Build dynamic update
    const updates: string[] = [];
    const params: any[] = [];

    if (scheduled_date !== undefined) {
      updates.push('scheduled_date = ?');
      params.push(scheduled_date);
    }
    if (platform !== undefined) {
      updates.push('platform = ?');
      params.push(platform);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    params.push(req.params.id, req.userId!);
    db.run(
      `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    saveDb();

    res.json({ success: true });
  } catch (err) {
    console.error('Calendar update error:', err);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

// DELETE /api/calendar/:id — remove an event
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const check = db.exec(
      'SELECT id FROM calendar_events WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId!]
    );

    if (check.length === 0 || check[0].values.length === 0) {
      res.status(404).json({ error: 'Calendar event not found' });
      return;
    }

    db.run('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.userId!,
    ]);
    saveDb();

    res.json({ success: true });
  } catch (err) {
    console.error('Calendar delete error:', err);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

export default router;
