const {
  findByEmail,
  findByPhone,
  findById,
  createUser,
  updateUserById,
} = require('../repositories/userRepository');
const {
  createRefreshToken,
  findByToken,
  revokeById,
} = require('../repositories/refreshTokenRepository');
const { createAuthLog } = require('../repositories/authLogRepository');
const redisClient = require('../config/redis');
const ApiError = require('../utils/apiError');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { generateOtp } = require('../utils/otp');
const { parseTokenExpiryToDate } = require('../utils/date');
const { USER_ROLE, USER_STATUS, AUTH_ACTION } = require('../constants/auth');
const env = require('../config/env');

const otpKey = (userId) => `otp:${userId}`;

const logAuthEvent = async ({ userId = null, action, success, ipAddress, userAgent, metadata = null }) => {
  await createAuthLog({
    userId,
    action,
    success,
    ipAddress,
    userAgent,
    metadata,
  });
};

const register = async ({ email, phone, password, ipAddress, userAgent }) => {
  const existingByEmail = await findByEmail(email);
  if (existingByEmail) {
    throw new ApiError(409, 'Email already exists');
  }

  const existingByPhone = await findByPhone(phone);
  if (existingByPhone) {
    throw new ApiError(409, 'Phone already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await createUser({
    email,
    phone,
    passwordHash,
    role: USER_ROLE.USER,
    status: USER_STATUS.PENDING,
    isVerified: false,
  });

  const otp = generateOtp();
  await redisClient.set(otpKey(user.id), otp, { EX: env.otpTtlSeconds });

  await logAuthEvent({
    userId: user.id,
    action: AUTH_ACTION.REGISTER,
    success: true,
    ipAddress,
    userAgent,
  });

  await logAuthEvent({
    userId: user.id,
    action: AUTH_ACTION.OTP_GENERATED,
    success: true,
    ipAddress,
    userAgent,
  });

  const response = {
    message: 'Registration successful. Verify OTP to activate account.',
    userId: user.id,
  };

  if (env.nodeEnv !== 'production') {
    response.otp = otp;
  }

  return response;
};

const verifyOtp = async ({ userId, otp, ipAddress, userAgent }) => {
  const user = await findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const storedOtp = await redisClient.get(otpKey(userId));

  if (!storedOtp || storedOtp !== otp) {
    await logAuthEvent({
      userId,
      action: AUTH_ACTION.OTP_FAILED,
      success: false,
      ipAddress,
      userAgent,
    });

    throw new ApiError(400, 'Invalid or expired OTP');
  }

  await updateUserById(userId, {
    isVerified: true,
    status: USER_STATUS.ACTIVE,
  });

  await redisClient.del(otpKey(userId));

  await logAuthEvent({
    userId,
    action: AUTH_ACTION.OTP_VERIFIED,
    success: true,
    ipAddress,
    userAgent,
  });

  return {
    message: 'OTP verified successfully. Account is now active.',
  };
};

const resendOtp = async ({ userId, ipAddress, userAgent }) => {
  const user = await findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isVerified || user.status === USER_STATUS.ACTIVE) {
    throw new ApiError(400, 'User is already verified');
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ApiError(403, 'User account is suspended');
  }

  const otp = generateOtp();
  await redisClient.set(otpKey(user.id), otp, { EX: env.otpTtlSeconds });

  await logAuthEvent({
    userId: user.id,
    action: AUTH_ACTION.OTP_RESENT,
    success: true,
    ipAddress,
    userAgent,
  });

  const response = {
    message: 'OTP resent successfully.',
    userId: user.id,
  };

  if (env.nodeEnv !== 'production') {
    response.otp = otp;
  }

  return response;
};

const login = async ({ email, password, ipAddress, userAgent }) => {
  const user = await findByEmail(email);

  if (!user) {
    await logAuthEvent({
      action: AUTH_ACTION.LOGIN_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'user_not_found', email },
    });
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    await logAuthEvent({
      userId: user.id,
      action: AUTH_ACTION.LOGIN_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'invalid_password' },
    });
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.status !== USER_STATUS.ACTIVE || !user.isVerified) {
    await logAuthEvent({
      userId: user.id,
      action: AUTH_ACTION.LOGIN_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'user_not_active' },
    });
    throw new ApiError(403, 'User account is not active');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decodedRefresh = verifyRefreshToken(refreshToken);

  await createRefreshToken({
    userId: user.id,
    token: refreshToken,
    expiresAt: parseTokenExpiryToDate(decodedRefresh),
    revoked: false,
  });

  await logAuthEvent({
    userId: user.id,
    action: AUTH_ACTION.LOGIN_SUCCESS,
    success: true,
    ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const refresh = async ({ refreshToken, ipAddress, userAgent }) => {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    await logAuthEvent({
      action: AUTH_ACTION.REFRESH_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'invalid_jwt' },
    });
    throw new ApiError(401, 'Invalid refresh token');
  }

  const savedToken = await findByToken(refreshToken);
  if (!savedToken) {
    await logAuthEvent({
      userId: decoded.sub,
      action: AUTH_ACTION.REFRESH_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'token_not_found' },
    });
    throw new ApiError(401, 'Refresh token not recognized');
  }

  if (savedToken.revoked || savedToken.expiresAt <= new Date()) {
    await logAuthEvent({
      userId: savedToken.userId,
      action: AUTH_ACTION.REFRESH_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'revoked_or_expired' },
    });
    throw new ApiError(401, 'Refresh token is revoked or expired');
  }

  if (savedToken.user.status !== USER_STATUS.ACTIVE || !savedToken.user.isVerified) {
    throw new ApiError(403, 'User account is not active');
  }

  const newAccessToken = signAccessToken(savedToken.user);

  // Rotate refresh token for stronger session security.
  const newRefreshToken = signRefreshToken(savedToken.user);
  const decodedNewRefresh = verifyRefreshToken(newRefreshToken);

  await revokeById(savedToken.id);
  await createRefreshToken({
    userId: savedToken.userId,
    token: newRefreshToken,
    expiresAt: parseTokenExpiryToDate(decodedNewRefresh),
    revoked: false,
  });

  await logAuthEvent({
    userId: savedToken.userId,
    action: AUTH_ACTION.REFRESH_SUCCESS,
    success: true,
    ipAddress,
    userAgent,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async ({ refreshToken, ipAddress, userAgent }) => {
  const savedToken = await findByToken(refreshToken);

  if (!savedToken) {
    await logAuthEvent({
      action: AUTH_ACTION.LOGOUT_FAILED,
      success: false,
      ipAddress,
      userAgent,
      metadata: { reason: 'token_not_found' },
    });
    throw new ApiError(401, 'Refresh token not recognized');
  }

  if (!savedToken.revoked) {
    await revokeById(savedToken.id);
  }

  await logAuthEvent({
    userId: savedToken.userId,
    action: AUTH_ACTION.LOGOUT_SUCCESS,
    success: true,
    ipAddress,
    userAgent,
  });

  return {
    message: 'Logged out successfully.',
  };
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
};
