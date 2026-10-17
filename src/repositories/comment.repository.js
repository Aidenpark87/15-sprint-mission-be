export class CommentRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  create(data) {
    return this.#db.orm.public.Comment.create(data);
  }

  findById(commentId) {
    return this.#db.orm.public.Comment.where({ id: Number(commentId) }).first();
  }

  findWithAuthor(commentId) {
    return this.#db.orm.public.Comment.where({ id: Number(commentId) })
      .include('author', (author) => author.select('id', 'nickname', 'image'))
      .first();
  }

  async findAllByParent({
    productId = null,
    articleId = null,
    cursor = null,
    limit = 10,
  } = {}) {
    let query = this.#db.orm.public.Comment;

    if (productId != null) {
      query = query.where({ productId: Number(productId) });
    }
    if (articleId != null) {
      query = query.where({ articleId: Number(articleId) });
    }
    if (cursor != null) {
      query = query.where((comment) => comment.id.lt(Number(cursor)));
    }

    const items = await query
      .orderBy((comment) => comment.createdAt.desc())
      .orderBy((comment) => comment.id.desc())
      .limit(limit + 1)
      .include('author', (author) => author.select('id', 'nickname', 'image'))
      .all();

    const hasNext = items.length > limit;
    const list = (hasNext ? items.slice(0, limit) : items).map(
      this.#toCommentView,
    );
    const nextCursor = hasNext ? items[limit].id : null;

    return { list, nextCursor };
  }

  update(commentId, data) {
    return this.#db.orm.public.Comment.where({ id: Number(commentId) }).update(data);
  }

  remove(commentId) {
    return this.#db.orm.public.Comment.where({ id: Number(commentId) }).delete();
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
