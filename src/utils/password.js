const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = (plainText, hash) => bcrypt.compare(plainText, hash);

module.exports = {
  hashPassword,
  comparePassword,
};
