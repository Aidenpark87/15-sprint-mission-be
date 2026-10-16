import { ERROR_MESSAGES, TEXT_LIMITS } from '#constants';
import { BadRequestException } from '#errors';

function validateArticle(req, _res, next) {
  const { title, content } = req.body ?? {};

  if (!title || !content) {
    throw new BadRequestException(ERROR_MESSAGES.ARTICLE_REQUIRED_FIELDS);
  }

  if (title.length > TEXT_LIMITS.ARTICLE_TITLE) {
    throw new BadRequestException(ERROR_MESSAGES.ARTICLE_TITLE_TOO_LONG);
  }

  if (content.length > TEXT_LIMITS.ARTICLE_CONTENT) {
    throw new BadRequestException(ERROR_MESSAGES.ARTICLE_CONTENT_TOO_LONG);
  }

  next();
}

function validateArticleUpdate(req, _res, next) {
  const { title, content, images } = req.body ?? {};

  if (title == null && content == null && images == null) {
    throw new BadRequestException(ERROR_MESSAGES.UPDATE_ARTICLE_REQUIRED);
  }

  if (title != null && title.length > TEXT_LIMITS.ARTICLE_TITLE) {
    throw new BadRequestException(ERROR_MESSAGES.ARTICLE_TITLE_TOO_LONG);
  }

  if (content != null && content.length > TEXT_LIMITS.ARTICLE_CONTENT) {
    throw new BadRequestException(ERROR_MESSAGES.ARTICLE_CONTENT_TOO_LONG);
  }

  next();
}

export { validateArticle, validateArticleUpdate };
