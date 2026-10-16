import { prisma } from '#db/prisma.js';

function findByUserAndProduct({ userId, productId }) {
  return prisma.like.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });
}

async function create({ userId, productId }) {
  const [, product] = await prisma.$transaction([
    prisma.like.create({ data: { userId, productId } }),
    prisma.product.update({
      where: { id: productId },
      data: { favoriteCount: { increment: 1 } },
    }),
  ]);

  return product;
}

async function remove({ userId, productId }) {
  const [, product] = await prisma.$transaction([
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

  return product;
}

function findByUserAndArticle({ userId, articleId }) {
  return prisma.like.findUnique({
    where: {
      userId_articleId: { userId, articleId },
    },
  });
}

async function createArticle({ userId, articleId }) {
  const [, article] = await prisma.$transaction([
    prisma.like.create({ data: { userId, articleId } }),
    prisma.article.update({
      where: { id: articleId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  return article;
}

async function removeArticle({ userId, articleId }) {
  const [, article] = await prisma.$transaction([
    prisma.like.delete({
      where: {
        userId_articleId: { userId, articleId },
      },
    }),
    prisma.article.update({
      where: { id: articleId },
      data: { likeCount: { decrement: 1 } },
    }),
  ]);

  return article;
}

export const likeRepository = {
  findByUserAndProduct,
  create,
  remove,
  findByUserAndArticle,
  createArticle,
  removeArticle,
};
