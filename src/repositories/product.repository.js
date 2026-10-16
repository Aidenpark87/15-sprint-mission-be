import { prisma } from '#db/prisma.js';

const DEFAULT_OWNER_NICKNAME = '판다마켓';

function toProductView(product, userId) {
  const { owner, likes, favoriteCount, ...rest } = product;

  return {
    ...rest,
    ownerNickname: owner?.nickname ?? DEFAULT_OWNER_NICKNAME,
    likeCount: favoriteCount,
    isLiked: userId != null ? likes.some((like) => like.userId === userId) : false,
  };
}

const SORT_ORDER_BY = {
  recent: [{ createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
  favorite: [{ favoriteCount: 'desc' }, { id: 'desc' }],
  like: [{ favoriteCount: 'desc' }, { id: 'desc' }],
};

function create(data) {
  return prisma.product.create({ data });
}

async function findById(productId, userId = null) {
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    include: {
      owner: { select: { nickname: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { author: { select: { nickname: true, id: true } } },
      },
      ...(userId != null && { likes: { where: { userId }, select: { userId: true } } }),
    },
  });

  return product ? toProductView(product, userId) : null;
}

async function findAll({ offset = 0, limit = 10, keyword = '', sort = 'recent', userId = null } = {}) {
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      }
    : {};

  const [list, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: SORT_ORDER_BY[sort] ?? SORT_ORDER_BY.recent,
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        favoriteCount: true,
        createdAt: true,
        owner: { select: { nickname: true } },
        ...(userId != null && { likes: { where: { userId }, select: { userId: true } } }),
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { list: list.map((row) => toProductView(row, userId)), totalCount };
}

function update(productId, data) {
  return prisma.product.update({
    where: { id: Number(productId) },
    data,
  });
}

function remove(productId) {
  return prisma.product.delete({
    where: { id: Number(productId) },
  });
}

export const productRepository = {
  create,
  findById,
  findAll,
  update,
  remove,
};
