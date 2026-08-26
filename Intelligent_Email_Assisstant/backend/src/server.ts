import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { initWebSocket } from './websocket/socketManager.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';
import prisma from './config/db.js';

const app = express();
const server = http.createServer(app);

// Initialize Real-Time WebSocket layer
initWebSocket(server);

// Middleware
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/health')) {
    logger.debug(`${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Bootstrap
server.listen(ENV.PORT, async () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 Intelligent Email Assistant Backend running on port ${ENV.PORT}`);
  logger.info(`🔗 Environment: ${ENV.NODE_ENV}`);
  logger.info(`🌐 Frontend Origin: ${ENV.FRONTEND_URL}`);
  logger.info(`🔑 Google OAuth configured: ${!!ENV.GOOGLE_CLIENT_ID}`);
  logger.info(`🤖 AI Provider (Claude/OpenAI/Gemini): ${!!(ENV.ANTHROPIC_API_KEY || ENV.OPENAI_API_KEY || ENV.GEMINI_API_KEY) ? 'Active' : 'Simulation Mode'}`);
  logger.info(`=======================================================`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});
