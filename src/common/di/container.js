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
  SocialAuthService,
} from '#services';
import {
  ArticleController,
  AuthController,
  CommentController,
  Controller,
  ImageController,
  ProductController,
  SocialAuthController,
  UserController,
} from '#controllers';
import {
  CookieProvider,
  OAuthStateProvider,
  PasswordProvider,
  TokenProvider,
} from '#providers';
import { AuthMiddleware } from '#middlewares';

export const createContainer = () => {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    config: asValue(config),
    db: asValue(db),
    oauthStateSecret: asValue(config.OAUTH_STATE_SECRET),
    clientBaseUrl: asValue(config.CLIENT_BASE_URL),

    userRepository: asClass(UserRepository, { lifetime: Lifetime.SINGLETON }),
    productRepository: asClass(ProductRepository, { lifetime: Lifetime.SINGLETON }),
    articleRepository: asClass(ArticleRepository, { lifetime: Lifetime.SINGLETON }),
    commentRepository: asClass(CommentRepository, { lifetime: Lifetime.SINGLETON }),
    likeRepository: asClass(LikeRepository, { lifetime: Lifetime.SINGLETON }),

    passwordProvider: asClass(PasswordProvider, { lifetime: Lifetime.SINGLETON }),
    tokenProvider: asClass(TokenProvider, { lifetime: Lifetime.SINGLETON }),
    cookieProvider: asClass(CookieProvider, { lifetime: Lifetime.SINGLETON }),
    oauthStateProvider: asClass(OAuthStateProvider, {
      lifetime: Lifetime.SINGLETON,
    }),

    authService: asClass(AuthService, { lifetime: Lifetime.SINGLETON }),
    socialAuthService: asClass(SocialAuthService, {
      lifetime: Lifetime.SINGLETON,
    }),
    productService: asClass(ProductService, { lifetime: Lifetime.SINGLETON }),
    articleService: asClass(ArticleService, { lifetime: Lifetime.SINGLETON }),
    commentService: asClass(CommentService, { lifetime: Lifetime.SINGLETON }),

    authMiddleware: asClass(AuthMiddleware, { lifetime: Lifetime.SINGLETON }),

    productController: asClass(ProductController, { lifetime: Lifetime.SINGLETON }),
    articleController: asClass(ArticleController, { lifetime: Lifetime.SINGLETON }),
    commentController: asClass(CommentController, { lifetime: Lifetime.SINGLETON }),
    authController: asClass(AuthController, { lifetime: Lifetime.SINGLETON }),
    socialAuthController: asClass(SocialAuthController, {
      lifetime: Lifetime.SINGLETON,
    }),
    userController: asClass(UserController, { lifetime: Lifetime.SINGLETON }),
    imageController: asClass(ImageController, { lifetime: Lifetime.SINGLETON }),

    controller: asClass(Controller, { lifetime: Lifetime.SINGLETON }),
  });

  return container.cradle;
};
