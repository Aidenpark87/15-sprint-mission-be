import { or } from '@prisma/orm-postgres/orm-client';

const DEFAULT_OWNER_NICKNAME = '판다마켓';

export class ProductRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.orm.public.Product.create(data);
  }

  async findById(productId, userId = null) {
    let query = this.#db.orm.public.Product.where({ id: Number(productId) })
      .include('owner', (owner) => owner.select('nickname'))
      .include('comments', (comments) =>
        comments
          .orderBy((comment) => comment.createdAt.desc())
          .limit(10)
          .include('author', (author) => author.select('id', 'nickname')),
      );

    if (userId != null) {
      query = query.include('likes', (likes) =>
        likes.where({ userId }).select('userId'),
      );
    }

    const product = await query.first();
    return product ? this.#toProductView(product, userId) : null;
  }

  async findAll({
    offset = 0,
    limit = 10,
    keyword = '',
    sort = 'recent',
    userId = null,
  } = {}) {
    const filtered = keyword
      ? this.#db.orm.public.Product.where((product) =>
          or(
            product.name.ilike(`%${keyword}%`),
            product.description.ilike(`%${keyword}%`),
          ),
        )
      : this.#db.orm.public.Product;

    let listQuery = filtered
      .orderBy(this.#orderBy(sort))
      .offset(offset)
      .limit(limit)
      .select('id', 'name', 'price', 'images', 'favoriteCount', 'createdAt')
      .include('owner', (owner) => owner.select('nickname'));

    if (userId != null) {
      listQuery = listQuery.include('likes', (likes) =>
        likes.where({ userId }).select('userId'),
      );
    }

    const [list, counted] = await Promise.all([
      listQuery.all(),
      filtered.aggregate((agg) => ({ total: agg.count() })),
    ]);

    return {
      list: list.map((row) => this.#toProductView(row, userId)),
      totalCount: counted.total,
    };
  }

  update(productId, data) {
    return this.#db.orm.public.Product.where({ id: Number(productId) }).update(data);
  }

  remove(productId) {
    return this.#db.orm.public.Product.where({ id: Number(productId) }).delete();
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

  #orderBy(sort) {
    const orderBy = {
      recent: [(product) => product.createdAt.desc(), (product) => product.id.desc()],
      oldest: [(product) => product.createdAt.asc(), (product) => product.id.asc()],
      favorite: [
        (product) => product.favoriteCount.desc(),
        (product) => product.id.desc(),
      ],
      like: [
        (product) => product.favoriteCount.desc(),
        (product) => product.id.desc(),
      ],
    };

    return orderBy[sort] ?? orderBy.recent;
  }
}
