import { prisma } from '#db/prisma.js';

function findByUserAndProduct({ userId, productId }) {
  return prisma.like.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });
}

async function create({ userId, productId }) {
  const deletedCount = await prisma.$transaction([
    prisma.like.create({ data: { userId, productId } }),
    prisma.product.update({
      where: { id: productId },
      data: { favoriteCount: { increment: 1 } },
    }),
  ]);

  return deletedCount[1];
}

async function remove({ userId, productId }) {
  const updated = await prisma.$transaction([
    prisma.like.delete({
      where: {
        userId_productId: { userId, productId },
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { favoriteCount: { decrement: 1 } },
    }),
  ]);

  return updated[1];
}

export const likeRepository = {
  findByUserAndProduct,
  create,
  remove,
};
