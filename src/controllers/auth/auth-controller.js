import { flattenError, z } from 'zod';
import { ERROR_MESSAGES, HTTP_STATUS } from '#constants';
import { BadRequestException } from '#exceptions';
import { BaseController } from '../base-controller.js';

export class AuthController extends BaseController {
  #authService;
  #cookieProvider;

  constructor({ authService, cookieProvider }) {
    super();
    this.#authService = authService;
    this.#cookieProvider = cookieProvider;
  }

  routes() {
    const parsePayload = (schema, body) => {
      const result = schema.safeParse(body ?? {});
      if (!result.success) {
        throw new BadRequestException(ERROR_MESSAGES.SIGNUP_FIELDS_INVALID, {
          fieldErrors: flattenError(result.error).fieldErrors,
        });
      }

      return result.data;
    };

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

    this.router.post('/signUp', async (req, res) => {
      const { email, nickname, password } = parsePayload(
        signUpSchema,
        req.body,
      );
      const { user, tokens } = await this.#authService.signUp({
        email,
        nickname,
        password,
      });

      this.#cookieProvider.setAuthCookies(res, tokens);
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: user });
    });

    this.router.post('/signIn', async (req, res) => {
      const { email, password } = parsePayload(signInSchema, req.body);
      const { user, tokens } = await this.#authService.signIn({
        email,
        password,
      });

      this.#cookieProvider.setAuthCookies(res, tokens);
      return res.status(HTTP_STATUS.OK).json({ success: true, data: user });
    });

    this.router.post('/logout', (_req, res) => {
      this.#cookieProvider.clearAuthCookies(res);
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    });

    return this.router;
  }
}
