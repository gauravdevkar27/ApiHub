import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import logger from '../config/logger.js';

const SAFE_REQUEST_ID = /^[\w-]{8,64}$/;

const requestLogger = pinoHttp({
  logger,

  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming)
        ? incoming
        : crypto.randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },

  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url.startsWith('/health/'),
  },

  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

export default requestLogger;