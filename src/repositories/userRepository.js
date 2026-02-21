const prisma = require('../config/prisma');

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
const findByPhone = (phone) => prisma.user.findUnique({ where: { phone } });
const findById = (id) => prisma.user.findUnique({ where: { id } });

const createUser = (data) => prisma.user.create({ data });

const updateUserById = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
  });

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  createUser,
  updateUserById,
};
