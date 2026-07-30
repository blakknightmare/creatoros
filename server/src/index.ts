import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import brandProfileRoutes from './routes/brandProfile.js';
import generateRoutes from './routes/generate.js';
import projectRoutes from './routes/projects.js';
import transcriptRoutes from './routes/transcript.js';
import batchRoutes from './routes/batch.js';
import subscriptionRoutes from './routes/subscription.js';
import calendarRoutes from './routes/calendar.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Subscription routes (before generation — no usage check needed for subscription info)
app.use('/api/subscription', subscriptionRoutes);

// Brand profile routes
app.use('/api/brand-profile', brandProfileRoutes);

// Content generation
app.use('/api/generate', generateRoutes);

// Projects
app.use('/api/projects', projectRoutes);

// Calendar
app.use('/api/calendar', calendarRoutes);

// Transcript intake
app.use('/api/transcript', transcriptRoutes);

// Batch content generation
app.use('/api/generate/batch', batchRoutes);

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
