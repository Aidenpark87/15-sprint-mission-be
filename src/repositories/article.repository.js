export class ArticleRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.article.create({ data });
  }

  async findById(articleId, userId = null) {
    const article = await this.#db.article.findUnique({
      where: { id: Number(articleId) },
      include: {
        ...(userId != null && { likes: { where: { userId }, select: { userId: true } } }),
      },
    });

    return article ? this.#toArticleView(article, userId) : null;
  }

  async findAll({ offset = 0, limit = 10, keyword = '', sort = 'recent', userId = null } = {}) {
    const where = keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {};

    const [list, totalCount] = await Promise.all([
      this.#db.article.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: this.#sortOrderBy(sort),
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
      this.#db.article.count({ where }),
    ]);

    return { list: list.map((row) => this.#toArticleView(row, userId)), totalCount };
  }

  update(articleId, data) {
    return this.#db.article.update({
      where: { id: Number(articleId) },
      data,
    });
  }

  remove(articleId) {
    return this.#db.article.delete({
      where: { id: Number(articleId) },
    });
  }

  #toArticleView(article, userId) {
    const { likes, ...rest } = article;

    return {
      ...rest,
      isLiked:
        userId != null && Array.isArray(likes)
          ? likes.some((like) => like.userId === userId)
          : false,
    };
  }

  #sortOrderBy(sort) {
    const sortOrderBy = {
      recent: [{ createdAt: 'desc' }, { id: 'desc' }],
      like: [{ likeCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
    };

    return sortOrderBy[sort] ?? sortOrderBy.recent;
  }
}
