import express from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import { BadRequestException, NotFoundException } from '#errors';
import { articleRepository, commentRepository } from '#repositories';
import {
  parseCursorQuery,
  parseIdParam,
  parseListQuery,
} from './query-parsers.js';

export const articlesRouter = express.Router();

articlesRouter.post('/', async (req, res) => {
  const { title, content } = req.body ?? {};

  if (!title || !content) {
    throw new BadRequestException(ERROR_MESSAGES.ARTICLE_REQUIRED_FIELDS);
  }

  const article = await articleRepository.create({ title, content });

  return res.status(HTTP_STATUS.CREATED).json({ success: true, data: article });
});

articlesRouter.get('/', async (req, res) => {
  const { offset, limit, keyword, sort } = parseListQuery(req.query);

  const data = await articleRepository.findAll({ offset, limit, keyword, sort });

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

articlesRouter.get('/:articleId', async (req, res) => {
  const articleId = parseIdParam(req.params.articleId);

  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({ success: true, data: article });
});

articlesRouter.patch('/:articleId', async (req, res) => {
  const articleId = parseIdParam(req.params.articleId);
  const { title, content } = req.body ?? {};

  if (title == null && content == null) {
    throw new BadRequestException(ERROR_MESSAGES.UPDATE_ARTICLE_REQUIRED);
  }

  const article = await articleRepository.update(articleId, {
    ...(title != null && { title }),
    ...(content != null && { content }),
  });

  return res.status(HTTP_STATUS.OK).json({ success: true, data: article });
});

articlesRouter.delete('/:articleId', async (req, res) => {
  const articleId = parseIdParam(req.params.articleId);

  await articleRepository.remove(articleId);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT);
});

articlesRouter.post('/:articleId/comments', async (req, res) => {
  const articleId = parseIdParam(req.params.articleId);
  const { content } = req.body ?? {};

  if (!content) {
    throw new BadRequestException(ERROR_MESSAGES.COMMENT_REQUIRED_FIELDS);
  }

  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_COMMENT_TARGET_MISSING);
  }

  const comment = await commentRepository.create({
    content,
    articleId,
  });

  return res.status(HTTP_STATUS.CREATED).json({ success: true, data: comment });
});

articlesRouter.get('/:articleId/comments', async (req, res) => {
  const articleId = parseIdParam(req.params.articleId);
  const { limit, cursor } = parseCursorQuery(req.query);

  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_COMMENT_TARGET_MISSING);
  }

  const data = await commentRepository.findAllByParent({
    articleId,
    cursor,
    limit,
  });

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});
