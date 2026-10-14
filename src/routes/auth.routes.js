import express from 'express';
import { flattenError, z } from 'zod';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '#errors';
import { userRepository } from '#repositories';
import { hashPassword, verifyPassword } from '#auth/password.js';
import { issueToken } from '#auth/token.js';

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

authRouter.post('/signUp', async (req, res) => {
  const { email, nickname, password } = parsePayload(signUpSchema, req.body);

  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) {
    throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_TAKEN);
  }

  const existingNickname = await userRepository.findByNickname(nickname);
  if (existingNickname) {
    throw new ConflictException(ERROR_MESSAGES.NICKNAME_ALREADY_TAKEN);
  }

  const encryptedPassword = await hashPassword(password);

  const user = await userRepository.create({
    email,
    nickname,
    image: null,
    encryptedPassword,
  });

  const accessToken = issueToken(user);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { accessToken },
  });
});

authRouter.post('/signIn', async (req, res) => {
  const { email, password } = parsePayload(signInSchema, req.body);

  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_OR_PASSWORD_INVALID);
  }

  const passwordValid = await verifyPassword(password, user.encryptedPassword);
  if (!passwordValid) {
    throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_OR_PASSWORD_INVALID);
  }

  const accessToken = issueToken(user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { accessToken },
  });
});
