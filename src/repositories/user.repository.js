import { prisma } from '#db/prisma.js';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  nickname: true,
  image: true,
  createdAt: true,
  updatedAt: true,
};

function create(data) {
  return prisma.user.create({ data });
}

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function findByNickname(nickname) {
  return prisma.user.findUnique({ where: { nickname } });
}

function findById(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
    select: PUBLIC_SELECT,
  });
}

export const userRepository = {
  create,
  findByEmail,
  findByNickname,
  findById,
};
