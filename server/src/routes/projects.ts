import { Router, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// POST /api/projects — save a generation
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, topic, content } = req.body;

    if (!type || !content) {
      res.status(400).json({ error: 'type and content are required' });
      return;
    }

    const db = await getDb();
    db.run(
      `INSERT INTO projects (user_id, content_type, topic, generated_content)
       VALUES (?, ?, ?, ?)`,
      [req.userId!, type, topic || null, content]
    );
    saveDb();

    // Get the newly inserted project
    const result = db.exec('SELECT last_insert_rowid()');
    const projectId = result[0].values[0][0];

    res.status(201).json({
      project: {
        id: projectId,
        user_id: req.userId!,
        content_type: type,
        topic: topic || null,
        generated_content: content,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Save project error:', err);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// GET /api/projects/stats — project stats for dashboard and analytics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.userId!;

    // Total projects
    const totalResult = db.exec(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = ?',
      [userId]
    );
    const totalProjects = totalResult[0]?.values[0]?.[0] || 0;

    // Most used content type
    let mostUsedType: string | null = null;
    if (totalProjects > 0) {
      const typeResult = db.exec(
        `SELECT content_type, COUNT(*) as cnt
         FROM projects WHERE user_id = ?
         GROUP BY content_type
         ORDER BY cnt DESC
         LIMIT 1`,
        [userId]
      );
      mostUsedType = typeResult[0]?.values[0]?.[0] || null;
    }

    // Projects this week (last 7 days)
    const weekResult = db.exec(
      `SELECT COUNT(*) as count FROM projects
       WHERE user_id = ? AND created_at >= datetime('now', '-7 days')`,
      [userId]
    );
    const projectsThisWeek = weekResult[0]?.values[0]?.[0] || 0;

    // Projects this month (last 30 days)
    const monthResult = db.exec(
      `SELECT COUNT(*) as count FROM projects
       WHERE user_id = ? AND created_at >= datetime('now', '-30 days')`,
      [userId]
    );
    const projectsThisMonth = monthResult[0]?.values[0]?.[0] || 0;

    // Generations by type
    const byTypeResult = db.exec(
      `SELECT content_type, COUNT(*) as cnt
       FROM projects WHERE user_id = ?
       GROUP BY content_type`,
      [userId]
    );
    const generationsByType: Record<string, number> = {};
    if (byTypeResult.length > 0 && byTypeResult[0].values.length > 0) {
      for (const row of byTypeResult[0].values) {
        generationsByType[row[0] as string] = row[1] as number;
      }
    }

    // Generations by day (last 30 days)
    const byDayResult = db.exec(
      `SELECT date(created_at) as day, COUNT(*) as cnt
       FROM projects WHERE user_id = ?
         AND created_at >= datetime('now', '-30 days')
       GROUP BY day
       ORDER BY day ASC`,
      [userId]
    );
    const generationsByDay: { date: string; count: number }[] = [];
    if (byDayResult.length > 0 && byDayResult[0].values.length > 0) {
      for (const row of byDayResult[0].values) {
        generationsByDay.push({ date: row[0] as string, count: row[1] as number });
      }
    }

    // Most used topic (excluding null topics)
    let mostUsedTopic: string | null = null;
    const topicResult = db.exec(
      `SELECT topic, COUNT(*) as cnt
       FROM projects WHERE user_id = ? AND topic IS NOT NULL AND topic != ''
       GROUP BY topic
       ORDER BY cnt DESC
       LIMIT 1`,
      [userId]
    );
    if (topicResult.length > 0 && topicResult[0].values.length > 0) {
      mostUsedTopic = topicResult[0].values[0]?.[0] || null;
    }

    // Batch generations count
    let batchGenerations = 0;
    const batchResult = db.exec(
      `SELECT COALESCE(batch_generation_count, 0) FROM users WHERE id = ?`,
      [userId]
    );
    if (batchResult.length > 0 && batchResult[0].values.length > 0) {
      batchGenerations = batchResult[0].values[0]?.[0] || 0;
    }

    res.json({
      totalProjects,
      mostUsedType,
      projectsThisWeek,
      projectsThisMonth,
      generationsByType,
      generationsByDay,
      mostUsedTopic,
      batchGenerations,
    });
  } catch (err) {
    console.error('Project stats error:', err);
    res.status(500).json({ error: 'Failed to get project stats' });
  }
});

// GET /api/projects — list user's projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const { type, limit, offset, sort, search } = req.query as Record<string, string>;

    let query = `SELECT id, user_id, content_type, topic, generated_content, created_at
                 FROM projects WHERE user_id = ?`;
    const params: any[] = [req.userId!];

    if (type && typeof type === 'string') {
      query += ' AND content_type = ?';
      params.push(type);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ' AND topic LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    const sortOrder = sort === 'oldest' ? 'ASC' : 'DESC';
    query += ` ORDER BY created_at ${sortOrder}`;

    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    query += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const result = db.exec(query, params);

    if (result.length === 0 || result[0].values.length === 0) {
      res.json({ projects: [], count: 0 });
      return;
    }

    const columns = result[0].columns;
    const projects = result[0].values.map((row: any[]) => {
      const project: any = {};
      columns.forEach((col: string, i: number) => {
        project[col] = row[i];
      });
      return project;
    });

    // Get total count matching filters
    let countQuery = 'SELECT COUNT(*) as count FROM projects WHERE user_id = ?';
    const countParams: any[] = [req.userId!];
    if (type && typeof type === 'string') {
      countQuery += ' AND content_type = ?';
      countParams.push(type);
    }
    if (search && typeof search === 'string' && search.trim()) {
      countQuery += ' AND topic LIKE ?';
      countParams.push(`%${search.trim()}%`);
    }
    const countResult = db.exec(countQuery, countParams);
    const count = countResult[0]?.values[0]?.[0] || 0;

    res.json({ projects, count });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// GET /api/projects/:id — get single project
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, user_id, content_type, topic, generated_content, created_at
       FROM projects WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId!]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const project: any = {};
    columns.forEach((col: string, i: number) => {
      project[col] = row[i];
    });

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// DELETE /api/projects/:id — delete a project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    // Verify ownership
    const check = db.exec(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId!]
    );

    if (check.length === 0 || check[0].values.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.userId!,
    ]);
    saveDb();

    res.json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
