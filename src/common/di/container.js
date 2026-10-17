import {
  asClass,
  asValue,
  createContainer as createAwilixContainer,
  InjectionMode,
  Lifetime,
} from 'awilix';
import { config } from '#config';
import { db } from '#prisma/db.js';
import {
  ArticleRepository,
  CommentRepository,
  LikeRepository,
  ProductRepository,
  UserRepository,
} from '#repositories';
import {
  ArticleService,
  AuthService,
  CommentService,
  ProductService,
} from '#services';
import {
  ArticleController,
  AuthController,
  CommentController,
  Controller,
  ImageController,
  ProductController,
  UserController,
} from '#controllers';
import { GoogleProvider, PasswordProvider, TokenProvider } from '#providers';
import { AuthMiddleware } from '#middlewares';

export const createContainer = () => {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    config: asValue(config),
    db: asValue(db),

    userRepository: asClass(UserRepository, { lifetime: Lifetime.SINGLETON }),
    productRepository: asClass(ProductRepository, { lifetime: Lifetime.SINGLETON }),
    articleRepository: asClass(ArticleRepository, { lifetime: Lifetime.SINGLETON }),
    commentRepository: asClass(CommentRepository, { lifetime: Lifetime.SINGLETON }),
    likeRepository: asClass(LikeRepository, { lifetime: Lifetime.SINGLETON }),

    passwordProvider: asClass(PasswordProvider, { lifetime: Lifetime.SINGLETON }),
    tokenProvider: asClass(TokenProvider, { lifetime: Lifetime.SINGLETON }),
    googleProvider: asClass(GoogleProvider, { lifetime: Lifetime.SINGLETON }),

    authService: asClass(AuthService, { lifetime: Lifetime.SINGLETON }),
    productService: asClass(ProductService, { lifetime: Lifetime.SINGLETON }),
    articleService: asClass(ArticleService, { lifetime: Lifetime.SINGLETON }),
    commentService: asClass(CommentService, { lifetime: Lifetime.SINGLETON }),

    authMiddleware: asClass(AuthMiddleware, { lifetime: Lifetime.SINGLETON }),

    productController: asClass(ProductController, { lifetime: Lifetime.SINGLETON }),
    articleController: asClass(ArticleController, { lifetime: Lifetime.SINGLETON }),
    commentController: asClass(CommentController, { lifetime: Lifetime.SINGLETON }),
    authController: asClass(AuthController, { lifetime: Lifetime.SINGLETON }),
    userController: asClass(UserController, { lifetime: Lifetime.SINGLETON }),
    imageController: asClass(ImageController, { lifetime: Lifetime.SINGLETON }),

    controller: asClass(Controller, { lifetime: Lifetime.SINGLETON }),
  });

  return container.cradle;
};
