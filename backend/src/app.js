import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow direct file:// or null-origin requests in development
      if (!origin || origin === 'null') {
        return callback(null, true);
      }

      // Allow localhost on any port in development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Check against configured allowed origins
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development with no origins configured, allow everything
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use((_req, _res, next) => {
  next(new AppError('Route not found', 404));
});

app.use(errorHandler);

export default app;
