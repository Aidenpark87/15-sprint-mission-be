import { ERROR_MESSAGES } from '#constants';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '#errors';
import { articleRepository, likeRepository } from '#repositories';

const MAX_IMAGES = 3;

function normalizeImages(images) {
  return Array.isArray(images) ? images.slice(0, MAX_IMAGES) : [];
}

async function findOwnedArticle(articleId, user) {
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }
  if (article.authorId != null && article.authorId !== user.id) {
    throw new ForbiddenException(ERROR_MESSAGES.ARTICLE_FORBIDDEN_OWNER);
  }

  return article;
}

async function create({ title, content, images, user }) {
  const article = await articleRepository.create({
    title,
    content,
    images: normalizeImages(images),
    author: user.nickname,
    authorId: user.id,
  });

  return articleRepository.findById(article.id, user.id);
}

function list({ offset, limit, keyword, sort, userId }) {
  return articleRepository.findAll({ offset, limit, keyword, sort, userId });
}

async function getDetail(articleId, userId) {
  const article = await articleRepository.findById(articleId, userId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  return article;
}

async function update(articleId, user, body) {
  const { title, content, images } = body;

  await findOwnedArticle(articleId, user);

  await articleRepository.update(articleId, {
    ...(title != null && { title }),
    ...(content != null && { content }),
    ...(images != null && { images: normalizeImages(images) }),
  });

  return articleRepository.findById(articleId, user.id);
}

async function remove(articleId, user) {
  await findOwnedArticle(articleId, user);
  await articleRepository.remove(articleId);
}

async function like(articleId, user) {
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  const existing = await likeRepository.findByUserAndArticle({
    userId: user.id,
    articleId,
  });
  if (existing) {
    throw new ConflictException(ERROR_MESSAGES.ARTICLE_LIKE_ALREADY_EXISTS);
  }

  await likeRepository.createArticle({ userId: user.id, articleId });

  return articleRepository.findById(articleId, user.id);
}

async function unlike(articleId, user) {
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  const existing = await likeRepository.findByUserAndArticle({
    userId: user.id,
    articleId,
  });
  if (!existing) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_LIKE_NOT_FOUND);
  }

  await likeRepository.removeArticle({ userId: user.id, articleId });

  return articleRepository.findById(articleId, user.id);
}

export const articleService = {
  create,
  list,
  getDetail,
  update,
  remove,
  like,
  unlike,
};
