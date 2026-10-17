export class LikeRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  findByUserAndProduct({ userId, productId }) {
    return this.#db.like.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
  }

  async create({ userId, productId }) {
    const [, product] = await this.#db.$transaction([
      this.#db.like.create({ data: { userId, productId } }),
      this.#db.product.update({
        where: { id: productId },
        data: { favoriteCount: { increment: 1 } },
      }),
    ]);

    return product;
  }

  async remove({ userId, productId }) {
    const [, product] = await this.#db.$transaction([
      this.#db.like.delete({
        where: {
          userId_productId: { userId, productId },
        },
      }),
      this.#db.product.update({
        where: { id: productId },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);

    return product;
  }

  findByUserAndArticle({ userId, articleId }) {
    return this.#db.like.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });
  }

  async createArticle({ userId, articleId }) {
    const [, article] = await this.#db.$transaction([
      this.#db.like.create({ data: { userId, articleId } }),
      this.#db.article.update({
        where: { id: articleId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return article;
  }

  async removeArticle({ userId, articleId }) {
    const [, article] = await this.#db.$transaction([
      this.#db.like.delete({
        where: {
          userId_articleId: { userId, articleId },
        },
      }),
      this.#db.article.update({
        where: { id: articleId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return article;
  }
}
