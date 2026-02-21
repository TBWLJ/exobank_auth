const asyncHandler = require('../utils/asyncHandler');
const {
  validateRegisterInput,
  validateOtpVerifyInput,
  validateResendOtpInput,
  validateLoginInput,
  validateRefreshInput,
  validateLogoutInput,
} = require('../validators/authValidator');
const authService = require('../services/authService');

const requestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null,
});

const register = asyncHandler(async (req, res) => {
  validateRegisterInput(req.body);

  const result = await authService.register({
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    ...requestContext(req),
  });

  res.status(201).json(result);
});

const verifyOtp = asyncHandler(async (req, res) => {
  validateOtpVerifyInput(req.body);

  const result = await authService.verifyOtp({
    userId: req.body.userId,
    otp: req.body.otp,
    ...requestContext(req),
  });

  res.status(200).json(result);
});

const resendOtp = asyncHandler(async (req, res) => {
  validateResendOtpInput(req.body);

  const result = await authService.resendOtp({
    userId: req.body.userId,
    ...requestContext(req),
  });

  res.status(200).json(result);
});

const login = asyncHandler(async (req, res) => {
  validateLoginInput(req.body);

  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    ...requestContext(req),
  });

  res.status(200).json(result);
});

const refresh = asyncHandler(async (req, res) => {
  validateRefreshInput(req.body);

  const result = await authService.refresh({
    refreshToken: req.body.refreshToken,
    ...requestContext(req),
  });

  res.status(200).json(result);
});

const logout = asyncHandler(async (req, res) => {
  validateLogoutInput(req.body);

  const result = await authService.logout({
    refreshToken: req.body.refreshToken,
    ...requestContext(req),
  });

  res.status(200).json(result);
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
};
