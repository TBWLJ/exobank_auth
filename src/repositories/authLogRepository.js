const prisma = require('../config/prisma');

const createAuthLog = (data) => prisma.authLog.create({ data });

module.exports = {
  createAuthLog,
};
