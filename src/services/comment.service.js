import { ERROR_MESSAGES } from '#constants';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '#errors';
import {
  articleRepository,
  commentRepository,
  productRepository,
} from '#repositories';

function assertCommentOwner(user, comment) {
  if (!user) {
    throw new UnauthorizedException(ERROR_MESSAGES.ACCESS_TOKEN_MISSING);
  }

  if (comment.authorId == null || comment.authorId !== user.id) {
    throw new ForbiddenException(
      comment.articleId != null
        ? ERROR_MESSAGES.ARTICLE_COMMENT_FORBIDDEN_OWNER
        : ERROR_MESSAGES.COMMENT_FORBIDDEN_OWNER,
    );
  }
}

async function findCommentWithOwner(commentId, user) {
  const comment = await commentRepository.findWithAuthor(commentId);
  if (!comment) {
    throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);
  }

  assertCommentOwner(user, comment);

  return comment;
}

async function createForProduct({ productId, content, user }) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_COMMENT_TARGET_MISSING);
  }

  return commentRepository.create({
    content,
    productId,
    authorId: user.id,
  });
}

async function createForArticle({ articleId, content, user }) {
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_COMMENT_TARGET_MISSING);
  }

  return commentRepository.create({
    content,
    articleId,
    authorId: user.id,
  });
}

async function listByProduct(productId, { cursor, limit }) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_COMMENT_TARGET_MISSING);
  }

  return commentRepository.findAllByParent({ productId, cursor, limit });
}

async function listByArticle(articleId, { cursor, limit }) {
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw new NotFoundException(ERROR_MESSAGES.ARTICLE_COMMENT_TARGET_MISSING);
  }

  return commentRepository.findAllByParent({ articleId, cursor, limit });
}

async function update(commentId, user, content) {
  await findCommentWithOwner(commentId, user);
  return commentRepository.update(commentId, { content });
}

async function remove(commentId, user) {
  await findCommentWithOwner(commentId, user);
  await commentRepository.remove(commentId);
}

export const commentService = {
  createForProduct,
  createForArticle,
  listByProduct,
  listByArticle,
  update,
  remove,
};
