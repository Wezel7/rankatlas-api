import 'dotenv/config';
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
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`RankAtlas API draait op poort ${PORT}`);
});
