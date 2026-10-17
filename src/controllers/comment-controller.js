import { BaseController } from './base-controller.js';
import { HTTP_STATUS } from '#constants';
import { parseIdParam } from '#common/utils/query-parsers.js';
import { validateCommentUpdate } from '#middlewares';

export class CommentController extends BaseController {
  #commentService;
  #authMiddleware;

  constructor({ commentService, authMiddleware }) {
    super();
    this.#commentService = commentService;
    this.#authMiddleware = authMiddleware;
  }

  routes() {
    const { optionalAuth } = this.#authMiddleware;

    this.router
      .route('/:commentId')
      .patch(optionalAuth, validateCommentUpdate, async (req, res) => {
        const commentId = parseIdParam(req.params.commentId);
        const { content } = req.body ?? {};
        const data = await this.#commentService.update(commentId, req.user, content);
        return res.status(HTTP_STATUS.OK).json({ success: true, data });
      })
      .delete(optionalAuth, async (req, res) => {
        const commentId = parseIdParam(req.params.commentId);
        await this.#commentService.remove(commentId, req.user);
        return res.sendStatus(HTTP_STATUS.NO_CONTENT);
      });

    return this.router;
  }
}
