import { BaseController } from './base-controller.js';
import { HTTP_STATUS } from '#constants';

export class UserController extends BaseController {
  #authMiddleware;

  constructor({ authMiddleware }) {
    super();
    this.#authMiddleware = authMiddleware;
  }

  routes() {
    this.router.get('/me', this.#authMiddleware.requireAuth, (req, res) => {
      return res.status(HTTP_STATUS.OK).json({ success: true, data: req.user });
    });

    return this.router;
  }
}
