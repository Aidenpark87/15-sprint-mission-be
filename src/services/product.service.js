import { ERROR_MESSAGES } from '#constants';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '#exceptions';

const MAX_IMAGES = 3;

export class ProductService {
  #productRepository;
  #likeRepository;

  constructor({ productRepository, likeRepository }) {
    this.#productRepository = productRepository;
    this.#likeRepository = likeRepository;
  }

  async create({ name, description, price, tags, images, userId }) {
    const product = await this.#productRepository.create({
      name,
      description,
      price: Number(price),
      tags: Array.isArray(tags) ? tags : [],
      images: this.#normalizeImages(images),
      ownerId: userId,
    });

    return this.#productRepository.findById(product.id, userId);
  }

  list({ offset, limit, keyword, sort, userId }) {
    return this.#productRepository.findAll({ offset, limit, keyword, sort, userId });
  }

  async getDetail(productId, userId) {
    const product = await this.#productRepository.findById(productId, userId);
    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  async update(productId, user, body) {
    const { name, description, price, tags, images } = body;

    await this.#findOwnedProduct(productId, user);

    await this.#productRepository.update(productId, {
      ...(name != null && { name }),
      ...(description != null && { description }),
      ...(price != null && { price: Number(price) }),
      ...(tags != null && { tags }),
      ...(images != null && { images: this.#normalizeImages(images) }),
    });

    return this.#productRepository.findById(productId, user.id);
  }

  async remove(productId, user) {
    await this.#findOwnedProduct(productId, user);
    await this.#productRepository.remove(productId);
  }

  async like(productId, user) {
    const product = await this.#productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const existing = await this.#likeRepository.findByUserAndProduct({
      userId: user.id,
      productId,
    });
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.FAVORITE_ALREADY_EXISTS);
    }

    await this.#likeRepository.create({ userId: user.id, productId });

    return this.#productRepository.findById(productId, user.id);
  }

  async unlike(productId, user) {
    const product = await this.#productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const existing = await this.#likeRepository.findByUserAndProduct({
      userId: user.id,
      productId,
    });
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.FAVORITE_NOT_FOUND);
    }

    await this.#likeRepository.remove({ userId: user.id, productId });

    return this.#productRepository.findById(productId, user.id);
  }

  #normalizeImages(images) {
    return Array.isArray(images) ? images.slice(0, MAX_IMAGES) : [];
  }

  async #findOwnedProduct(productId, user) {
    const product = await this.#productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    if (product.ownerId !== user.id) {
      throw new ForbiddenException(ERROR_MESSAGES.PRODUCT_FORBIDDEN_OWNER);
    }

    return product;
  }
}
