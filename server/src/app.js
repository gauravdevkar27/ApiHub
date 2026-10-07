import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import healthRoutes from './routes/index.js';
import requestLogger from './middleware/requestLogger.js';
import {env} from './config/env.js';
import { apiLimiter } from './middleware/rateLimiters.js';


const app = express();

app.set('trust proxy', env.TRUST_PROXY_HOPS);

app.use(requestLogger); 
app.use(helmet());        // secure HTTP headers
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ApiHub server is running!',
  });
});

app.use('/health', healthRoutes);
app.use('/api',apiLimiter, routes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});


app.use(errorHandler);

export default app;