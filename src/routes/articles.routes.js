import express from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import { BadRequestException } from '#errors';
import {
  optionalAuth,
  requireAuth,
  validateArticle,
  validateArticleUpdate,
  validateComment,
} from '#middlewares';
import { articleService, commentService } from '#services';
import {
  parseCursorQuery,
  parseIdParam,
  parseListQuery,
} from './query-parsers.js';

export const articlesRouter = express.Router();

articlesRouter
  .route('/')
  .post(requireAuth, validateArticle, async (req, res) => {
    const { title, content, images } = req.body ?? {};

    const data = await articleService.create({
      title,
      content,
      images,
      user: req.user,
    });

    return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
  })
  .get(optionalAuth, async (req, res) => {
    const { offset, limit, keyword, sort } = parseListQuery(req.query);

    const data = await articleService.list({
      offset,
      limit,
      keyword,
      sort,
      userId: req.user?.id ?? null,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  });

articlesRouter
  .route('/:articleId')
  .get(optionalAuth, async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);

    const data = await articleService.getDetail(
      articleId,
      req.user?.id ?? null,
    );

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .patch(requireAuth, validateArticleUpdate, async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);
    const { title, content, images } = req.body ?? {};

    if (title == null && content == null && images == null) {
      throw new BadRequestException(ERROR_MESSAGES.UPDATE_ARTICLE_REQUIRED);
    }

    const data = await articleService.update(articleId, req.user, {
      title,
      content,
      images,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .delete(requireAuth, async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);

    await articleService.remove(articleId, req.user);

    return res.sendStatus(HTTP_STATUS.NO_CONTENT);
  });

articlesRouter
  .route('/:articleId/like')
  .post(requireAuth, async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);

    const data = await articleService.like(articleId, req.user);

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .delete(requireAuth, async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);

    const data = await articleService.unlike(articleId, req.user);

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  });

articlesRouter
  .route('/:articleId/comments')
  .post(requireAuth, validateComment, async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);
    const { content } = req.body ?? {};

    const data = await commentService.createForArticle({
      articleId,
      content,
      user: req.user,
    });

    return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
  })
  .get(async (req, res) => {
    const articleId = parseIdParam(req.params.articleId);
    const { limit, cursor } = parseCursorQuery(req.query);

    const data = await commentService.listByArticle(articleId, {
      cursor,
      limit,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  });
