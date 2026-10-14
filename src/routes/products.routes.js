import express from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '#errors';
import {
  commentRepository,
  likeRepository,
  productRepository,
} from '#repositories';
import { requireAuth, optionalAuth } from '#middlewares';
import {
  parseCursorQuery,
  parseIdParam,
  parseListQuery,
} from './query-parsers.js';

export const productsRouter = express.Router();

async function getProductForOwner(productId, user) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  if (product.ownerId !== user.id) {
    throw new ForbiddenException(ERROR_MESSAGES.PRODUCT_FORBIDDEN_OWNER);
  }

  return product;
}

productsRouter.post('/', requireAuth, async (req, res) => {
  const { name, description, price, tags } = req.body ?? {};

  if (!name || !description || price == null) {
    throw new BadRequestException(ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS);
  }

  const product = await productRepository.create({
    name,
    description,
    price: Number(price),
    tags: Array.isArray(tags) ? tags : [],
    ownerId: req.user.id,
  });

  const data = await productRepository.findById(product.id, req.user.id);

  return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
});

productsRouter.get('/', optionalAuth, async (req, res) => {

  const { offset, limit, keyword, sort } = parseListQuery(req.query, {
    allowedSorts: ['recent', 'oldest', 'favorite'],
  });

  const data = await productRepository.findAll({
    offset,
    limit,
    keyword,
    sort,
    userId: req.user?.id ?? null,
  });

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

productsRouter.get('/:productId', optionalAuth, async (req, res) => {
  const productId = parseIdParam(req.params.productId);

  const product = await productRepository.findById(productId, req.user?.id ?? null);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({ success: true, data: product });
});

productsRouter.patch('/:productId', requireAuth, async (req, res) => {
  const productId = parseIdParam(req.params.productId);
  const { name, description, price, tags } = req.body ?? {};

  if (name == null && description == null && price == null && tags == null) {
    throw new BadRequestException(ERROR_MESSAGES.UPDATE_PRODUCT_REQUIRED);
  }

  await getProductForOwner(productId, req.user);

  await productRepository.update(productId, {
    ...(name != null && { name }),
    ...(description != null && { description }),
    ...(price != null && { price: Number(price) }),
    ...(tags != null && { tags }),
  });

  const data = await productRepository.findById(productId, req.user.id);

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

productsRouter.delete('/:productId', requireAuth, async (req, res) => {
  const productId = parseIdParam(req.params.productId);

  await getProductForOwner(productId, req.user);

  await productRepository.remove(productId);

  return res.sendStatus(HTTP_STATUS.NO_CONTENT);
});

productsRouter.post('/:productId/favorite', requireAuth, async (req, res) => {
  const productId = parseIdParam(req.params.productId);

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const existing = await likeRepository.findByUserAndProduct({
    userId: req.user.id,
    productId,
  });
  if (existing) {
    throw new ConflictException(ERROR_MESSAGES.FAVORITE_ALREADY_EXISTS);
  }

  await likeRepository.create({ userId: req.user.id, productId });

  const data = await productRepository.findById(productId, req.user.id);

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

productsRouter.delete('/:productId/favorite', requireAuth, async (req, res) => {
  const productId = parseIdParam(req.params.productId);

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const existing = await likeRepository.findByUserAndProduct({
    userId: req.user.id,
    productId,
  });
  if (!existing) {
    throw new NotFoundException(ERROR_MESSAGES.FAVORITE_NOT_FOUND);
  }

  await likeRepository.remove({ userId: req.user.id, productId });

  const data = await productRepository.findById(productId, req.user.id);

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

productsRouter.post('/:productId/comments', requireAuth, async (req, res) => {
  const productId = parseIdParam(req.params.productId);
  const { content } = req.body ?? {};

  if (!content) {
    throw new BadRequestException(ERROR_MESSAGES.COMMENT_REQUIRED_FIELDS);
  }

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_COMMENT_TARGET_MISSING);
  }

  const comment = await commentRepository.create({
    content,
    productId,
    authorId: req.user.id,
  });

  return res.status(HTTP_STATUS.CREATED).json({ success: true, data: comment });
});

productsRouter.get('/:productId/comments', async (req, res) => {
  const productId = parseIdParam(req.params.productId);
  const { limit, cursor } = parseCursorQuery(req.query);

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_COMMENT_TARGET_MISSING);
  }

  const data = await commentRepository.findAllByParent({
    productId,
    cursor,
    limit,
  });

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});
