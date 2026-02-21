const crypto = require('crypto');

const generateOtp = () => {
  const value = crypto.randomInt(0, 1000000);
  return value.toString().padStart(6, '0');
};

module.exports = {
  generateOtp,
};
