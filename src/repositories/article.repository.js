import { or } from '@prisma/orm-postgres/orm-client';

const LIST_FIELDS = [
  'id',
  'title',
  'content',
  'images',
  'likeCount',
  'author',
  'createdAt',
];

export class ArticleRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.orm.public.Article.create(data);
  }

  async findById(articleId, userId = null) {
    let query = this.#db.orm.public.Article.where({ id: Number(articleId) });
    if (userId != null) {
      query = query.include('likes', (likes) =>
        likes.where({ userId }).select('userId'),
      );
    }

    const article = await query.first();
    return article ? this.#toArticleView(article, userId) : null;
  }

  async findAll({
    offset = 0,
    limit = 10,
    keyword = '',
    sort = 'recent',
    userId = null,
  } = {}) {
    const filtered = keyword
      ? this.#db.orm.public.Article.where((article) =>
          or(
            article.title.ilike(`%${keyword}%`),
            article.content.ilike(`%${keyword}%`),
          ),
        )
      : this.#db.orm.public.Article;

    let listQuery = filtered
      .orderBy(this.#orderBy(sort))
      .offset(offset)
      .limit(limit)
      .select(...LIST_FIELDS);

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
      list: list.map((row) => this.#toArticleView(row, userId)),
      totalCount: counted.total,
    };
  }

  update(articleId, data) {
    return this.#db.orm.public.Article.where({ id: Number(articleId) }).update(data);
  }

  remove(articleId) {
    return this.#db.orm.public.Article.where({ id: Number(articleId) }).delete();
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

  #orderBy(sort) {
    const orderBy = {
      recent: [(article) => article.createdAt.desc(), (article) => article.id.desc()],
      like: [
        (article) => article.likeCount.desc(),
        (article) => article.createdAt.desc(),
        (article) => article.id.desc(),
      ],
      oldest: [(article) => article.createdAt.asc(), (article) => article.id.asc()],
    };

    return orderBy[sort] ?? orderBy.recent;
  }
}
