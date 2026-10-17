export class CommentRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.comment.create({ data });
  }

  findById(commentId) {
    return this.#db.comment.findUnique({
      where: { id: Number(commentId) },
    });
  }

  findWithAuthor(commentId) {
    return this.#db.comment.findUnique({
      where: { id: Number(commentId) },
      include: {
        author: { select: { id: true, nickname: true, image: true } },
      },
    });
  }

  async findAllByParent({
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

    const items = await this.#db.comment.findMany({
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
    const list = (hasNext ? items.slice(0, limit) : items).map(this.#toCommentView);
    const nextCursor = hasNext ? items[list.length].id : null;

    return { list, nextCursor };
  }

  update(commentId, data) {
    return this.#db.comment.update({
      where: { id: Number(commentId) },
      data,
    });
  }

  remove(commentId) {
    return this.#db.comment.delete({
      where: { id: Number(commentId) },
    });
  }

  #toCommentView(comment) {
    const { author, ...rest } = comment;

    return {
      ...rest,
      writer: author
        ? { id: author.id, nickname: author.nickname, image: author.image }
        : null,
    };
  }
}
