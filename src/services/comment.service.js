import { ERROR_MESSAGES } from '#constants';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '#exceptions';

export class CommentService {
  #articleRepository;
  #commentRepository;
  #productRepository;

  constructor({ articleRepository, commentRepository, productRepository }) {
    this.#articleRepository = articleRepository;
    this.#commentRepository = commentRepository;
    this.#productRepository = productRepository;
  }

  async createForProduct({ productId, content, user }) {
    const product = await this.#productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_COMMENT_TARGET_MISSING);
    }

    return this.#commentRepository.create({
      content,
      productId,
      authorId: user.id,
    });
  }

  async createForArticle({ articleId, content, user }) {
    const article = await this.#articleRepository.findById(articleId);
    if (!article) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_COMMENT_TARGET_MISSING);
    }

    return this.#commentRepository.create({
      content,
      articleId,
      authorId: user.id,
    });
  }

  async listByProduct(productId, { cursor, limit }) {
    const product = await this.#productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_COMMENT_TARGET_MISSING);
    }

    return this.#commentRepository.findAllByParent({ productId, cursor, limit });
  }

  async listByArticle(articleId, { cursor, limit }) {
    const article = await this.#articleRepository.findById(articleId);
    if (!article) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_COMMENT_TARGET_MISSING);
    }

    return this.#commentRepository.findAllByParent({ articleId, cursor, limit });
  }

  async update(commentId, user, content) {
    await this.#findCommentWithOwner(commentId, user);
    return this.#commentRepository.update(commentId, { content });
  }

  async remove(commentId, user) {
    await this.#findCommentWithOwner(commentId, user);
    await this.#commentRepository.remove(commentId);
  }

  async #findCommentWithOwner(commentId, user) {
    const comment = await this.#commentRepository.findWithAuthor(commentId);
    if (!comment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
    }

    this.#assertCommentOwner(user, comment);

    return comment;
  }

  #assertCommentOwner(user, comment) {
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.ACCESS_TOKEN_MISSING);
    }

    if (comment.authorId == null || comment.authorId !== user.id) {
      throw new ForbiddenException(
        comment.articleId != null
          ? ERROR_MESSAGES.ARTICLE_COMMENT_FORBIDDEN_OWNER
          : ERROR_MESSAGES.COMMENT_FORBIDDEN_OWNER,
      );
    }
  }
}
