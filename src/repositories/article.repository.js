import { prisma } from '#db/prisma.js';

function toArticleView(article, userId) {
  const { likes, ...rest } = article;

  return {
    ...rest,
    isLiked:
      userId != null && Array.isArray(likes)
        ? likes.some((like) => like.userId === userId)
        : false,
  };
}

function create(data) {
  return prisma.article.create({ data });
}

async function findById(articleId, userId = null) {
  const article = await prisma.article.findUnique({
    where: { id: Number(articleId) },
    include: {
      ...(userId != null && { likes: { where: { userId }, select: { userId: true } } }),
    },
  });

  return article ? toArticleView(article, userId) : null;
}

const SORT_ORDER_BY = {
  recent: [{ createdAt: 'desc' }, { id: 'desc' }],
  like: [{ likeCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
};

async function findAll({ offset = 0, limit = 10, keyword = '', sort = 'recent', userId = null } = {}) {
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
        images: true,
        likeCount: true,
        author: true,
        createdAt: true,
        ...(userId != null && { likes: { where: { userId }, select: { userId: true } } }),
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { list: list.map((row) => toArticleView(row, userId)), totalCount };
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
