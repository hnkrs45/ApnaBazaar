// ──────────────────────────────────────────────────────────
// In-Memory Rate Limiter (Zero-dependency, serverless & local friendly)
// ──────────────────────────────────────────────────────────
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later."
}) => {
  const hits = new Map();

  // Periodic cleanup so memory stays minimal
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
  if (timer.unref) timer.unref();

  return (req, res, next) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown-client";
    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retrySec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader("Retry-After", retrySec);
      const msg = typeof message === "object" ? message.message || "Too many requests" : message;
      return res.status(429).json({ success: false, message: msg });
    }

    next();
  };
};

/** Strict limiter for auth endpoints (brute-force protection) */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts. Please try again in 15 minutes."
});

/** Moderate limiter for AI search */
export const aiSearchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many search requests. Please slow down."
});

/** General API limiter */
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests. Please try again later."
});

