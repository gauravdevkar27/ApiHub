import { Temporal } from 'temporal-polyfill';

globalThis.Temporal = Temporal;

import { env } from './config/env.js'; 
import logger from './config/logger.js';
import app from './app.js';

const server = app.listen(env.PORT, () => {
  logger.info(`Server is up and running on http://localhost:${env.PORT}`);
});

// Graceful shutdown: finish in-flight requests before exiting (deploys, Ctrl+C)
const shutdown = (signal) => {
  logger.info({ signal }, 'Shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});