import { flattenError } from 'zod';
import { BaseController } from '../base-controller.js';
import { config } from '#config';
import { ERROR_MESSAGES } from '#constants';
import { BadRequestException, UnauthorizedException } from '#exceptions';
import {
  socialCallbackQuerySchema,
  socialLoginQuerySchema,
  socialProviderParamSchema,
} from './dto/social-dto.js';

export class SocialAuthController extends BaseController {
  #socialAuthService;
  #cookieProvider;
  #oauthStateProvider;

  constructor({ socialAuthService, cookieProvider, oauthStateProvider }) {
    super();
    this.#socialAuthService = socialAuthService;
    this.#cookieProvider = cookieProvider;
    this.#oauthStateProvider = oauthStateProvider;
  }

  routes() {
    const parsePart = (schema, value) => {
      const result = schema.safeParse(value ?? {});
      if (!result.success) {
        throw new BadRequestException(ERROR_MESSAGES.SOCIAL_AUTH_FAILED, {
          fieldErrors: flattenError(result.error).fieldErrors,
        });
      }

      return result.data;
    };

    this.router.get('/social/:provider/login', (req, res) => {
      const { provider } = parsePart(socialProviderParamSchema, req.params);
      const { next } = parsePart(socialLoginQuerySchema, req.query);
      return this.socialRedirect(res, provider, next);
    });

    this.router.get('/social/callback/:provider', (req, res) => {
      const { provider } = parsePart(socialProviderParamSchema, req.params);
      const query = parsePart(socialCallbackQuerySchema, req.query);
      return this.socialCallback(req, res, provider, query);
    });

    return this.router;
  }

  socialRedirect(res, provider, next) {
    if (!this.#socialAuthService.isConfigured(provider)) {
      throw new BadRequestException(ERROR_MESSAGES.SOCIAL_LOGIN_UNAVAILABLE);
    }

    const { state, transactionNonce, codeVerifier, codeChallenge } =
      this.#oauthStateProvider.createState({ provider, next });

    this.#cookieProvider.setOAuthTransactionCookies(res, {
      transactionNonce,
      codeVerifier,
    });

    return res.redirect(
      this.generateSocialLoginLink(provider, { state, codeChallenge }),
    );
  }

  async socialCallback(req, res, provider, query) {
    const { code, state, error, error_description: errorDescription } = query;
    const codeVerifier = this.#cookieProvider.getOAuthCodeVerifier(req);
    const transactionNonce =
      this.#cookieProvider.getOAuthTransactionNonce(req);

    this.#cookieProvider.clearOAuthTransactionCookies(res);

    try {
      const transaction = this.#oauthStateProvider.verifyState({
        state,
        provider,
        transactionNonce,
        codeVerifier,
      });

      if (!transaction) {
        throw new BadRequestException(
          ERROR_MESSAGES.INVALID_SOCIAL_AUTH_STATE,
        );
      }

      if (error) {
        throw new UnauthorizedException(
          errorDescription || ERROR_MESSAGES.SOCIAL_AUTH_FAILED,
        );
      }

      if (!code) {
        throw new BadRequestException(ERROR_MESSAGES.SOCIAL_AUTH_CODE_REQUIRED);
      }

      const { tokens } = await this.#socialAuthService.loginOrSignUp({
        provider,
        code,
        state,
        codeVerifier,
      });

      this.#cookieProvider.setAuthCookies(res, tokens);

      return res.redirect(
        new URL(transaction.next, config.CLIENT_BASE_URL).toString(),
      );
    } catch (caught) {
      return res.redirect(this.#buildClientErrorUrl(caught));
    }
  }

  #buildClientErrorUrl(caught) {
    const errorCode =
      {
        409: 'link_required',
        401: 'auth_failed',
        400: 'invalid_request',
      }[caught?.statusCode] ?? 'unknown';

    const url = new URL('/signin', config.CLIENT_BASE_URL);
    url.searchParams.set('error', errorCode);

    return url.toString();
  }

  generateSocialLoginLink(provider, { state, codeChallenge }) {
    const generator = this.socialLoginLinkGenerator[provider];
    if (!generator) {
      throw new BadRequestException(
        ERROR_MESSAGES.UNSUPPORTED_SOCIAL_PROVIDER,
      );
    }

    return generator({ state, codeChallenge });
  }

  get socialLoginLinkGenerator() {
    return {
      google: ({ state, codeChallenge }) => {
        const params = new URLSearchParams({
          client_id: config.GOOGLE_CLIENT_ID,
          redirect_uri: `${this.#redirectUri}/google`,
          response_type: 'code',
          scope: 'openid email profile',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          prompt: 'select_account',
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      },
      kakao: ({ state, codeChallenge }) => {
        const params = new URLSearchParams({
          client_id: config.KAKAO_CLIENT_ID,
          redirect_uri: `${this.#redirectUri}/kakao`,
          response_type: 'code',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          prompt: 'select_account',
        });

        return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
      },
    };
  }

  get #redirectUri() {
    return `${config.API_BASE_URL}/api/auth/social/callback`;
  }
}
