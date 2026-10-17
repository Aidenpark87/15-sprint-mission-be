export class LikeRepository {
  #db;

  constructor({ db }) {
    this.#db = db;
  }

  findByUserAndProduct({ userId, productId }) {
    return this.#db.orm.public.Like.where({ userId, productId }).first();
  }

  async create({ userId, productId }) {
    return this.#db.transaction(async (tx) => {
      await tx.orm.public.Like.create({ userId, productId });
      await tx.execute(this.#incrementProductFavorite(productId, 1));

      return productId;
    });
  }

  async remove({ userId, productId }) {
    return this.#db.transaction(async (tx) => {
      await tx.orm.public.Like.where({ userId, productId }).delete();
      await tx.execute(this.#incrementProductFavorite(productId, -1));

      return productId;
    });
  }

  findByUserAndArticle({ userId, articleId }) {
    return this.#db.orm.public.Like.where({ userId, articleId }).first();
  }

  async createArticle({ userId, articleId }) {
    return this.#db.transaction(async (tx) => {
      await tx.orm.public.Like.create({ userId, articleId });
      await tx.execute(this.#incrementArticleLike(articleId, 1));

      return articleId;
    });
  }

  async removeArticle({ userId, articleId }) {
    return this.#db.transaction(async (tx) => {
      await tx.orm.public.Like.where({ userId, articleId }).delete();
      await tx.execute(this.#incrementArticleLike(articleId, -1));

      return articleId;
    });
  }

  #incrementProductFavorite(productId, delta) {
    return this.#db.raw.sql`
      UPDATE "Product"
      SET "favoriteCount" = "favoriteCount" + ${delta}
      WHERE "id" = ${productId}
    `
      .affectedCount()
      .build();
  }

  #incrementArticleLike(articleId, delta) {
    return this.#db.raw.sql`
      UPDATE "Article"
      SET "likeCount" = "likeCount" + ${delta}
      WHERE "id" = ${articleId}
    `
      .affectedCount()
      .build();
  }
}
