import express from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '#errors';
import { commentRepository } from '#repositories';
import { optionalAuth } from '#middlewares';
import { parseIdParam } from './query-parsers.js';

export const commentsRouter = express.Router();

function assertProductCommentOwner(req, comment) {
  if (comment.articleId != null) {
    return;
  }

  if (!req.user) {
    throw new UnauthorizedException(ERROR_MESSAGES.ACCESS_TOKEN_MISSING);
  }

  if (comment.authorId !== req.user.id) {
    throw new ForbiddenException(ERROR_MESSAGES.COMMENT_FORBIDDEN_OWNER);
  }
}

commentsRouter.patch('/:commentId', optionalAuth, async (req, res) => {
  const commentId = parseIdParam(req.params.commentId);
  const { content } = req.body ?? {};

  if (!content) {
    throw new BadRequestException(ERROR_MESSAGES.UPDATE_COMMENT_REQUIRED);
  }

  const comment = await commentRepository.findWithAuthor(commentId);
  if (!comment) {
    throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
  }

  assertProductCommentOwner(req, comment);

  const updated = await commentRepository.update(commentId, { content });

  return res.status(HTTP_STATUS.OK).json({ success: true, data: updated });
});

commentsRouter.delete('/:commentId', optionalAuth, async (req, res) => {
  const commentId = parseIdParam(req.params.commentId);

  const comment = await commentRepository.findWithAuthor(commentId);
  if (!comment) {
    throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
  }

  assertProductCommentOwner(req, comment);

  await commentRepository.remove(commentId);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT);
});
