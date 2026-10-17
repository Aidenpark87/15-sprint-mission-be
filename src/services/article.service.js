import { ERROR_MESSAGES } from '#constants';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '#exceptions';

const MAX_IMAGES = 3;

export class ArticleService {
  #articleRepository;
  #likeRepository;

  constructor({ articleRepository, likeRepository }) {
    this.#articleRepository = articleRepository;
    this.#likeRepository = likeRepository;
  }

  async create({ title, content, images, user }) {
    const article = await this.#articleRepository.create({
      title,
      content,
      images: this.#normalizeImages(images),
      author: user.nickname,
      authorId: user.id,
    });

    return this.#articleRepository.findById(article.id, user.id);
  }

  list({ offset, limit, keyword, sort, userId }) {
    return this.#articleRepository.findAll({ offset, limit, keyword, sort, userId });
  }

  async getDetail(articleId, userId) {
    const article = await this.#articleRepository.findById(articleId, userId);
    if (!article) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    }

    return article;
  }

  async update(articleId, user, body) {
    const { title, content, images } = body;

    await this.#findOwnedArticle(articleId, user);

    await this.#articleRepository.update(articleId, {
      ...(title != null && { title }),
      ...(content != null && { content }),
      ...(images != null && { images: this.#normalizeImages(images) }),
    });

    return this.#articleRepository.findById(articleId, user.id);
  }

  async remove(articleId, user) {
    await this.#findOwnedArticle(articleId, user);
    await this.#articleRepository.remove(articleId);
  }

  async like(articleId, user) {
    const article = await this.#articleRepository.findById(articleId);
    if (!article) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    }

    const existing = await this.#likeRepository.findByUserAndArticle({
      userId: user.id,
      articleId,
    });
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.ARTICLE_LIKE_ALREADY_EXISTS);
    }

    await this.#likeRepository.createArticle({ userId: user.id, articleId });

    return this.#articleRepository.findById(articleId, user.id);
  }

  async unlike(articleId, user) {
    const article = await this.#articleRepository.findById(articleId);
    if (!article) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    }

    const existing = await this.#likeRepository.findByUserAndArticle({
      userId: user.id,
      articleId,
    });
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_LIKE_NOT_FOUND);
    }

    await this.#likeRepository.removeArticle({ userId: user.id, articleId });

    return this.#articleRepository.findById(articleId, user.id);
  }

  #normalizeImages(images) {
    return Array.isArray(images) ? images.slice(0, MAX_IMAGES) : [];
  }

  async #findOwnedArticle(articleId, user) {
    const article = await this.#articleRepository.findById(articleId);
    if (!article) {
      throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    }
    if (article.authorId != null && article.authorId !== user.id) {
      throw new ForbiddenException(ERROR_MESSAGES.ARTICLE_FORBIDDEN_OWNER);
    }

    return article;
  }
}
