import { ERROR_MESSAGES } from '#constants';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '#errors';
import { likeRepository, productRepository } from '#repositories';

const MAX_IMAGES = 3;

function normalizeImages(images) {
  return Array.isArray(images) ? images.slice(0, MAX_IMAGES) : [];
}

async function findOwnedProduct(productId, user) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }
  if (product.ownerId !== user.id) {
    throw new ForbiddenException(ERROR_MESSAGES.PRODUCT_FORBIDDEN_OWNER);
  }

  return product;
}

async function create({
  name,
  description,
  price,
  tags,
  images,
  userId,
}) {
  const product = await productRepository.create({
    name,
    description,
    price: Number(price),
    tags: Array.isArray(tags) ? tags : [],
    images: normalizeImages(images),
    ownerId: userId,
  });

  return productRepository.findById(product.id, userId);
}

function list({ offset, limit, keyword, sort, userId }) {
  return productRepository.findAll({ offset, limit, keyword, sort, userId });
}

async function getDetail(productId, userId) {
  const product = await productRepository.findById(productId, userId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return product;
}

async function update(productId, user, body) {
  const { name, description, price, tags, images } = body;

  await findOwnedProduct(productId, user);

  await productRepository.update(productId, {
    ...(name != null && { name }),
    ...(description != null && { description }),
    ...(price != null && { price: Number(price) }),
    ...(tags != null && { tags }),
    ...(images != null && { images: normalizeImages(images) }),
  });

  return productRepository.findById(productId, user.id);
}

async function remove(productId, user) {
  await findOwnedProduct(productId, user);
  await productRepository.remove(productId);
}

async function like(productId, user) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const existing = await likeRepository.findByUserAndProduct({
    userId: user.id,
    productId,
  });
  if (existing) {
    throw new ConflictException(ERROR_MESSAGES.FAVORITE_ALREADY_EXISTS);
  }

  await likeRepository.create({ userId: user.id, productId });

  return productRepository.findById(productId, user.id);
}

async function unlike(productId, user) {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const existing = await likeRepository.findByUserAndProduct({
    userId: user.id,
    productId,
  });
  if (!existing) {
    throw new NotFoundException(ERROR_MESSAGES.FAVORITE_NOT_FOUND);
  }

  await likeRepository.remove({ userId: user.id, productId });

  return productRepository.findById(productId, user.id);
}

export const productService = {
  create,
  list,
  getDetail,
  update,
  remove,
  like,
  unlike,
};
