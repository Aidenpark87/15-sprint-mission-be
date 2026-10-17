import { ERROR_MESSAGES, TEXT_LIMITS } from '#constants';
import { BadRequestException } from '#exceptions';

function validateComment(req, _res, next) {
  const { content } = req.body ?? {};

  if (!content) {
    throw new BadRequestException(ERROR_MESSAGES.COMMENT_REQUIRED_FIELDS);
  }

  if (content.length > TEXT_LIMITS.COMMENT) {
    throw new BadRequestException(ERROR_MESSAGES.COMMENT_TOO_LONG);
  }

  next();
}

function validateCommentUpdate(req, _res, next) {
  const { content } = req.body ?? {};

  if (!content) {
    throw new BadRequestException(ERROR_MESSAGES.UPDATE_COMMENT_REQUIRED);
  }

  if (content.length > TEXT_LIMITS.COMMENT) {
    throw new BadRequestException(ERROR_MESSAGES.COMMENT_TOO_LONG);
  }

  next();
}

export { validateComment, validateCommentUpdate };
