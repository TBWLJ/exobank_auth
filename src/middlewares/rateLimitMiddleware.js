const redisClient = require('../config/redis');
const env = require('../config/env');

const rateLimitMiddleware = (prefix, maxAttempts = env.rateLimitMaxAttempts, windowSeconds = env.rateLimitWindowSeconds) => {
  return async (req, res, next) => {
    const key = `rate_limit:${prefix}:${req.ip}`;

    const attempts = await redisClient.incr(key);
    if (attempts === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    if (attempts > maxAttempts) {
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
      });
    }

    return next();
  };
};

module.exports = rateLimitMiddleware;
