const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl });
};

const signRefreshToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl });
};

const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
