import { prisma } from '#db/prisma.js';

function toCommentView(comment) {
  const { author, ...rest } = comment;

  return {
    ...rest,
    writer: author ? { id: author.id, nickname: author.nickname, image: author.image } : null,
  };
}

function create(data) {
  return prisma.comment.create({ data });
}

function findById(commentId) {
  return prisma.comment.findUnique({
    where: { id: Number(commentId) },
  });
}

function findWithAuthor(commentId) {
  return prisma.comment.findUnique({
    where: { id: Number(commentId) },
    include: {
      author: { select: { id: true, nickname: true, image: true } },
    },
  });
}

async function findAllByParent({
  productId = null,
  articleId = null,
  cursor = null,
  limit = 10,
} = {}) {
  const where = {
    ...(productId != null ? { productId: Number(productId) } : {}),
    ...(articleId != null ? { articleId: Number(articleId) } : {}),
    ...(cursor != null ? { id: { lt: Number(cursor) } } : {}),
  };

  const items = await prisma.comment.findMany({
    where,
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, nickname: true, image: true } },
    },
  });

  const hasNext = items.length > limit;
  const list = (hasNext ? items.slice(0, limit) : items).map(toCommentView);
  const nextCursor = hasNext ? items[list.length].id : null;

  return { list, nextCursor };
}

function update(commentId, data) {
  return prisma.comment.update({
    where: { id: Number(commentId) },
    data,
  });
}

function remove(commentId) {
  return prisma.comment.delete({
    where: { id: Number(commentId) },
  });
}

export const commentRepository = {
  create,
  findById,
  findWithAuthor,
  findAllByParent,
  update,
  remove,
};
