const DEFAULT_OWNER_NICKNAME = '판다마켓';

export class ProductRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.product.create({ data });
  }

  async findById(productId, userId = null) {
    const product = await this.#db.product.findUnique({
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

    return product ? this.#toProductView(product, userId) : null;
  }

  async findAll({ offset = 0, limit = 10, keyword = '', sort = 'recent', userId = null } = {}) {
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {};

    const [list, totalCount] = await Promise.all([
      this.#db.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: this.#sortOrderBy(sort),
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
      this.#db.product.count({ where }),
    ]);

    return { list: list.map((row) => this.#toProductView(row, userId)), totalCount };
  }

  update(productId, data) {
    return this.#db.product.update({
      where: { id: Number(productId) },
      data,
    });
  }

  remove(productId) {
    return this.#db.product.delete({
      where: { id: Number(productId) },
    });
  }

  #toProductView(product, userId) {
    const { owner, likes, favoriteCount, ...rest } = product;

    return {
      ...rest,
      ownerNickname: owner?.nickname ?? DEFAULT_OWNER_NICKNAME,
      likeCount: favoriteCount,
      isLiked:
        userId != null ? likes.some((like) => like.userId === userId) : false,
    };
  }

  #sortOrderBy(sort) {
    const sortOrderBy = {
      recent: [{ createdAt: 'desc' }, { id: 'desc' }],
      oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
      favorite: [{ favoriteCount: 'desc' }, { id: 'desc' }],
      like: [{ favoriteCount: 'desc' }, { id: 'desc' }],
    };

    return sortOrderBy[sort] ?? sortOrderBy.recent;
  }
}
