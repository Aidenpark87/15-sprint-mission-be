import express from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import { BadRequestException } from '#errors';
import {
  optionalAuth,
  requireAuth,
  validateComment,
  validateProduct,
  validateProductUpdate,
} from '#middlewares';
import { commentService, productService } from '#services';
import {
  parseCursorQuery,
  parseIdParam,
  parseListQuery,
} from './query-parsers.js';

export const productsRouter = express.Router();

productsRouter
  .route('/')
  .get(optionalAuth, async (req, res) => {
    const { offset, limit, keyword, sort } = parseListQuery(req.query, {
      allowedSorts: ['recent', 'oldest', 'favorite', 'like'],
    });

    const data = await productService.list({
      offset,
      limit,
      keyword,
      sort,
      userId: req.user?.id ?? null,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .post(requireAuth, validateProduct, async (req, res) => {
    const { name, description, price, tags, images } = req.body ?? {};

    const data = await productService.create({
      name,
      description,
      price,
      tags,
      images,
      userId: req.user.id,
    });

    return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
  });

productsRouter
  .route('/:productId')
  .get(optionalAuth, async (req, res) => {
    const productId = parseIdParam(req.params.productId);

    const data = await productService.getDetail(
      productId,
      req.user?.id ?? null,
    );

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .patch(requireAuth, validateProductUpdate, async (req, res) => {
    const productId = parseIdParam(req.params.productId);
    const { name, description, price, tags, images } = req.body ?? {};

    if (
      name == null &&
      description == null &&
      price == null &&
      tags == null &&
      images == null
    ) {
      throw new BadRequestException(ERROR_MESSAGES.UPDATE_PRODUCT_REQUIRED);
    }

    const data = await productService.update(productId, req.user, {
      name,
      description,
      price,
      tags,
      images,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .delete(requireAuth, async (req, res) => {
    const productId = parseIdParam(req.params.productId);

    await productService.remove(productId, req.user);

    return res.sendStatus(HTTP_STATUS.NO_CONTENT);
  });

productsRouter
  .route('/:productId/like')
  .post(requireAuth, async (req, res) => {
    const productId = parseIdParam(req.params.productId);

    const data = await productService.like(productId, req.user);

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  })
  .delete(requireAuth, async (req, res) => {
    const productId = parseIdParam(req.params.productId);

    const data = await productService.unlike(productId, req.user);

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  });

productsRouter
  .route('/:productId/comments')
  .post(requireAuth, validateComment, async (req, res) => {
    const productId = parseIdParam(req.params.productId);
    const { content } = req.body ?? {};

    const data = await commentService.createForProduct({
      productId,
      content,
      user: req.user,
    });

    return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
  })
  .get(async (req, res) => {
    const productId = parseIdParam(req.params.productId);
    const { limit, cursor } = parseCursorQuery(req.query);

    const data = await commentService.listByProduct(productId, {
      cursor,
      limit,
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  });
