import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ─── Global Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ───────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ApiHub server is running!',
  });
});

// ─── API Routes ─────────────────────────────────────
app.use('/api', routes);

// ─── 404 Catch-all ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Central Error Handler (must be last) ───────────
app.use(errorHandler);

export default app;