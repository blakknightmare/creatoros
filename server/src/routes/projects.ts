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

// GET /api/projects — list user's projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const { type, limit, offset } = req.query as Record<string, string>;

    let query = `SELECT id, user_id, content_type, topic, generated_content, created_at
                 FROM projects WHERE user_id = ?`;
    const params: any[] = [req.userId!];

    if (type && typeof type === 'string') {
      query += ' AND content_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const limitNum = limit ? parseInt(limit, 10) : 50;
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
      columns.forEach((col, i) => {
        project[col] = row[i];
      });
      return project;
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM projects WHERE user_id = ?';
    const countParams: any[] = [req.userId!];
    if (type && typeof type === 'string') {
      countQuery += ' AND content_type = ?';
      countParams.push(type);
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
    columns.forEach((col, i) => {
      project[col] = row[i];
    });

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

export default router;
