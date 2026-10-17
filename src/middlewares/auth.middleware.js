import { ERROR_MESSAGES } from '#constants';
import { UnauthorizedException } from '#exceptions';

function extractBearerToken(authorization) {
  if (typeof authorization !== 'string') {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export class AuthMiddleware {
  #userRepository;
  #tokenProvider;

  constructor({ userRepository, tokenProvider }) {
    this.#userRepository = userRepository;
    this.#tokenProvider = tokenProvider;
  }

  async authenticate(req) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.ACCESS_TOKEN_MISSING);
    }

    const payload = this.#tokenProvider.verifyToken(token);
    const user = await this.#userRepository.findById(Number(payload.sub));
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }

    return user;
  }

  requireAuth = async (req, _res, next) => {
    try {
      req.user = await this.authenticate(req);
      next();
    } catch (error) {
      next(error);
    }
  };

  optionalAuth = async (req, _res, next) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (token) {
        req.user = await this.authenticate(req);
      }
    } catch {
      req.user = undefined;
    }

    next();
  };
}
