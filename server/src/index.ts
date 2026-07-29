import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  // Initialize database
  await initDb();

  app.listen(PORT, () => {
    console.log(`CreatorOS server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
