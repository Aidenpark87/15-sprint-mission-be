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
  const userRepository = new UserRepository({ db });
  const productRepository = new ProductRepository({ db });
  const articleRepository = new ArticleRepository({ db });
  const commentRepository = new CommentRepository({ db });
  const likeRepository = new LikeRepository({ db });

  const passwordProvider = new PasswordProvider();
  const tokenProvider = new TokenProvider({ config });
  const googleProvider = new GoogleProvider({ config });

  const authService = new AuthService({
    userRepository,
    passwordProvider,
    tokenProvider,
    googleProvider,
  });
  const productService = new ProductService({ productRepository, likeRepository });
  const articleService = new ArticleService({ articleRepository, likeRepository });
  const commentService = new CommentService({
    articleRepository,
    commentRepository,
    productRepository,
  });

  const authMiddleware = new AuthMiddleware({ userRepository, tokenProvider });

  const productController = new ProductController({
    productService,
    commentService,
    authMiddleware,
  });
  const articleController = new ArticleController({
    articleService,
    commentService,
    authMiddleware,
  });
  const commentController = new CommentController({
    commentService,
    authMiddleware,
  });
  const authController = new AuthController({ authService });
  const userController = new UserController({ authMiddleware });
  const imageController = new ImageController();

  const controller = new Controller({
    productController,
    articleController,
    commentController,
    authController,
    userController,
    imageController,
  });

  return { controller, authMiddleware, config, db };
};
