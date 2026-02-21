const prisma = require('../config/prisma');

const createRefreshToken = (data) => prisma.refreshToken.create({ data });

const findByToken = (token) =>
  prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

const revokeById = (id) =>
  prisma.refreshToken.update({
    where: { id },
    data: { revoked: true },
  });

module.exports = {
  createRefreshToken,
  findByToken,
  revokeById,
};
