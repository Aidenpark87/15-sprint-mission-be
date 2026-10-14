import express from 'express';
import { articlesRouter } from './articles.routes.js';
import { authRouter } from './auth.routes.js';
import { commentsRouter } from './comments.routes.js';
import { productsRouter } from './products.routes.js';
import { usersRouter } from './users.routes.js';

export const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Hello, Panda Market!' });
});

router.use('/products', productsRouter);
router.use('/articles', articlesRouter);
router.use('/comments', commentsRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
