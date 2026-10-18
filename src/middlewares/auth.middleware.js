import { ERROR_MESSAGES } from '#constants';
import { UnauthorizedException } from '#exceptions';

export class AuthMiddleware {
  #userRepository;
  #tokenProvider;
  #authService;
  #cookieProvider;

  constructor({ userRepository, tokenProvider, authService, cookieProvider }) {
    this.#userRepository = userRepository;
    this.#tokenProvider = tokenProvider;
    this.#authService = authService;
    this.#cookieProvider = cookieProvider;
  }

  async resolveUser(req, res) {
    const { accessToken, refreshToken } = req.cookies ?? {};

    if (accessToken) {
      const payload = this.#tokenProvider.verifyAccessToken(accessToken);
      if (payload) {
        const user = await this.#userRepository.findById(Number(payload.sub));
        if (user) {
          return user;
        }
      }
    }

    if (!refreshToken) {
      if (accessToken) {
        this.#cookieProvider.clearAuthCookies(res);
      }
      return null;
    }

    try {
      const { user, tokens } =
        await this.#authService.refreshTokens(refreshToken);
      this.#cookieProvider.setAuthCookies(res, tokens);
      return user;
    } catch {
      this.#cookieProvider.clearAuthCookies(res);
      return null;
    }
  }

  requireAuth = async (req, res, next) => {
    try {
      const user = await this.resolveUser(req, res);
      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.ACCESS_TOKEN_MISSING);
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };

  optionalAuth = async (req, res, next) => {
    try {
      const user = await this.resolveUser(req, res);
      if (user) {
        req.user = user;
      }
    } catch {
      req.user = undefined;
    }

    next();
  };
}
