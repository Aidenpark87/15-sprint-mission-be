import { BaseController } from './base-controller.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import { BadRequestException } from '#exceptions';
import { parseCursorQuery, parseIdParam, parseListQuery } from '#common/utils/query-parsers.js';
import {
  validateArticle,
  validateArticleUpdate,
  validateComment,
} from '#middlewares';

export class ArticleController extends BaseController {
  #articleService;
  #commentService;
  #authMiddleware;

  constructor({ articleService, commentService, authMiddleware }) {
    super();
    this.#articleService = articleService;
    this.#commentService = commentService;
    this.#authMiddleware = authMiddleware;
  }

  routes() {
    const { requireAuth, optionalAuth } = this.#authMiddleware;

    this.router
      .route('/')
      .post(requireAuth, validateArticle, async (req, res) => {
        const { title, content, images } = req.body ?? {};
        const data = await this.#articleService.create({
          title,
          content,
          images,
          user: req.user,
        });
        return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
      })
      .get(optionalAuth, async (req, res) => {
        const { offset, limit, keyword, sort } = parseListQuery(req.query);
        const data = await this.#articleService.list({
          offset,
          limit,
          keyword,
          sort,
          userId: req.user?.id ?? null,
        });
        return res.status(HTTP_STATUS.OK).json({ success: true, data });
      });

    this.router
      .route('/:articleId')
      .get(optionalAuth, async (req, res) => {
        const articleId = parseIdParam(req.params.articleId);
        const data = await this.#articleService.getDetail(
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
        const data = await this.#articleService.update(articleId, req.user, {
          title,
          content,
          images,
        });
        return res.status(HTTP_STATUS.OK).json({ success: true, data });
      })
      .delete(requireAuth, async (req, res) => {
        const articleId = parseIdParam(req.params.articleId);
        await this.#articleService.remove(articleId, req.user);
        return res.sendStatus(HTTP_STATUS.NO_CONTENT);
      });

    this.router
      .route('/:articleId/like')
      .post(requireAuth, async (req, res) => {
        const articleId = parseIdParam(req.params.articleId);
        const data = await this.#articleService.like(articleId, req.user);
        return res.status(HTTP_STATUS.OK).json({ success: true, data });
      })
      .delete(requireAuth, async (req, res) => {
        const articleId = parseIdParam(req.params.articleId);
        const data = await this.#articleService.unlike(articleId, req.user);
        return res.status(HTTP_STATUS.OK).json({ success: true, data });
      });

    this.router
      .route('/:articleId/comments')
      .post(requireAuth, validateComment, async (req, res) => {
        const articleId = parseIdParam(req.params.articleId);
        const { content } = req.body ?? {};
        const data = await this.#commentService.createForArticle({
          articleId,
          content,
          user: req.user,
        });
        return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
      })
      .get(async (req, res) => {
        const articleId = parseIdParam(req.params.articleId);
        const { limit, cursor } = parseCursorQuery(req.query);
        const data = await this.#commentService.listByArticle(articleId, {
          cursor,
          limit,
        });
        return res.status(HTTP_STATUS.OK).json({ success: true, data });
      });

    return this.router;
  }
}
