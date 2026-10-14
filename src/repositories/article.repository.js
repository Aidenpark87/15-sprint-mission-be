import { prisma } from '#db/prisma.js';

function create(data) {
  return prisma.article.create({ data });
}

function findById(articleId) {
  return prisma.article.findUnique({
    where: { id: Number(articleId) },
  });
}

const SORT_ORDER_BY = {
  recent: [{ createdAt: 'desc' }, { id: 'desc' }],
  like: [{ likeCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
};

async function findAll({ offset = 0, limit = 10, keyword = '', sort = 'recent' } = {}) {
  const where = keyword
    ? {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
        ],
      }
    : {};

  const [list, totalCount] = await Promise.all([
    prisma.article.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: SORT_ORDER_BY[sort] ?? SORT_ORDER_BY.recent,
      select: {
        id: true,
        title: true,
        content: true,
        likeCount: true,
        author: true,
        createdAt: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { list, totalCount };
}

function update(articleId, data) {
  return prisma.article.update({
    where: { id: Number(articleId) },
    data,
  });
}

function remove(articleId) {
  return prisma.article.delete({
    where: { id: Number(articleId) },
  });
}

export const articleRepository = {
  create,
  findById,
  findAll,
  update,
  remove,
};
