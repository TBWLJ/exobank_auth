const ApiError = require('../utils/apiError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const validateRegisterInput = ({ email, phone, password }) => {
  if (!email || !phone || !password) {
    throw new ApiError(400, 'email, phone, and password are required');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Invalid email format');
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new ApiError(
      400,
      'Password must be 8+ chars with uppercase, lowercase, number, and special char'
    );
  }
};

const validateOtpVerifyInput = ({ userId, otp }) => {
  if (!userId || !otp) {
    throw new ApiError(400, 'userId and otp are required');
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, 'OTP must be a 6-digit number');
  }
};

const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }
};

const validateRefreshInput = ({ refreshToken }) => {
  if (!refreshToken) {
    throw new ApiError(400, 'refreshToken is required');
  }
};

const validateResendOtpInput = ({ userId }) => {
  if (!userId) {
    throw new ApiError(400, 'userId is required');
  }
};

const validateLogoutInput = ({ refreshToken }) => {
  if (!refreshToken) {
    throw new ApiError(400, 'refreshToken is required');
  }
};

module.exports = {
  validateRegisterInput,
  validateOtpVerifyInput,
  validateLoginInput,
  validateRefreshInput,
  validateResendOtpInput,
  validateLogoutInput,
};
