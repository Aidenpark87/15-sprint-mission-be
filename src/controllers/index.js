import { BaseController } from './base-controller.js';
import { HTTP_STATUS } from '#constants';

export * from './base-controller.js';
export * from './product-controller.js';
export * from './article-controller.js';
export * from './comment-controller.js';
export * from './auth-controller.js';
export * from './user-controller.js';
export * from './image-controller.js';

export class Controller extends BaseController {
  #productController;
  #articleController;
  #commentController;
  #authController;
  #userController;
  #imageController;

  constructor({
    productController,
    articleController,
    commentController,
    authController,
    userController,
    imageController,
  }) {
    super();
    this.#productController = productController;
    this.#articleController = articleController;
    this.#commentController = commentController;
    this.#authController = authController;
    this.#userController = userController;
    this.#imageController = imageController;
  }

  routes() {
    this.router.get('/', (_req, res) => {
      res.json({ message: 'Hello, Panda Market!' });
    });

    this.router.use('/products', this.#productController.routes());
    this.router.use('/articles', this.#articleController.routes());
    this.router.use('/comments', this.#commentController.routes());
    this.router.use('/auth', this.#authController.routes());
    this.router.use('/users', this.#userController.routes());
    this.router.use('/images', this.#imageController.routes());

    return this.router;
  }

  ping(_req, res) {
    res.status(HTTP_STATUS.OK).json({ message: 'pong' });
  }
}
