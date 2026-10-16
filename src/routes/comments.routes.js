import express from 'express';
import { HTTP_STATUS } from '#constants';
import { optionalAuth, validateCommentUpdate } from '#middlewares';
import { commentService } from '#services';
import { parseIdParam } from './query-parsers.js';

export const commentsRouter = express.Router();

commentsRouter
  .route('/:commentId')
  .patch(optionalAuth, validateCommentUpdate, async (req, res) => {
    const commentId = parseIdParam(req.params.commentId);
    const { content } = req.body ?? {};

    const data = await commentService.update(commentId, req.user, content);

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .delete(optionalAuth, async (req, res) => {
    const commentId = parseIdParam(req.params.commentId);

    await commentService.remove(commentId, req.user);

    return res.sendStatus(HTTP_STATUS.NO_CONTENT);
  });
