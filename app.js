import { createRequire } from 'module';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the same directory as app.js (works regardless of cwd)
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';

import authRoutes    from './src/routes/auth.js';
import agentRoutes   from './src/routes/agents.js';
import reviewRoutes  from './src/routes/reviews.js';
import keywordRoutes from './src/routes/keywords.js';
import metricRoutes  from './src/routes/metrics.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/auth',     authRoutes);
app.use('/agents',   agentRoutes);
app.use('/reviews',  reviewRoutes);
app.use('/keywords', keywordRoutes);
app.use('/metrics',  metricRoutes);

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  ts: new Date().toISOString(),
  dir: __dirname,
  env_loaded: !!process.env.DB_USER,
  db_user: process.env.DB_USER ? process.env.DB_USER.substring(0,3) + '***' : 'MISSING',
}));

// Serve frontend static files in production
const distPath = join(__dirname, '../rankatlas-app/dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`RankAtlas API draait op poort ${PORT}`);
});
