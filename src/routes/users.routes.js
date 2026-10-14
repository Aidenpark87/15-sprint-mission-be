import express from 'express';
import { HTTP_STATUS } from '#constants';
import { requireAuth } from '#middlewares';

export const usersRouter = express.Router();

usersRouter.get('/me', requireAuth, async (req, res) => {
  return res.status(HTTP_STATUS.OK).json({ success: true, data: req.user });
});
