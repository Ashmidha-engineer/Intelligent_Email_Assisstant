import rateLimit from 'express-rate-limit';

// Rate limiter for AI-intensive workflow endpoints (60 calls per 15 minutes per IP/User)
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    error: 'Too many AI requests. Please wait a few moments before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter (300 requests per 15 minutes)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
