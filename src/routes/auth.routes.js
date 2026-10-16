import express from 'express';
import { flattenError, z } from 'zod';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import { BadRequestException } from '#errors';
import { authService } from '#services';

export const authRouter = express.Router();

function parsePayload(schema, body) {
  const result = schema.safeParse(body ?? {});

  if (!result.success) {
    throw new BadRequestException(ERROR_MESSAGES.SIGNUP_FIELDS_INVALID, {
      fieldErrors: flattenError(result.error).fieldErrors,
    });
  }

  return result.data;
}

const signUpSchema = z
  .object({
    email: z.email('이메일 형식이 올바르지 않습니다.'),
    nickname: z
      .string()
      .trim()
      .min(1, '닉네임은 필수입니다.')
      .max(20, '닉네임은 20자 이하로 입력해 주세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    passwordConfirmation: z.string().min(1, '비밀번호 확인이 필요합니다.'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: ERROR_MESSAGES.SIGNUP_PASSWORD_MISMATCH,
    path: ['passwordConfirmation'],
  });

const signInSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호가 필요합니다.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, ERROR_MESSAGES.REFRESH_TOKEN_MISSING),
});

const googleSchema = z.object({
  code: z.string().min(1, ERROR_MESSAGES.GOOGLE_LOGIN_FAILED),
});

authRouter.post('/signUp', async (req, res) => {
  const { email, nickname, password } = parsePayload(signUpSchema, req.body);
  const data = await authService.signUp({ email, nickname, password });

  return res.status(HTTP_STATUS.CREATED).json({ success: true, data });
});

authRouter.post('/signIn', async (req, res) => {
  const { email, password } = parsePayload(signInSchema, req.body);
  const data = await authService.signIn({ email, password });

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = parsePayload(refreshSchema, req.body);
  const data = await authService.refresh(refreshToken);

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});

authRouter.post('/google', async (req, res) => {
  const { code } = parsePayload(googleSchema, req.body);
  const data = await authService.signInWithGoogle({ code });

  return res.status(HTTP_STATUS.OK).json({ success: true, data });
});
