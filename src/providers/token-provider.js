import jwt from 'jsonwebtoken';
import { ERROR_MESSAGES } from '#constants';
import { UnauthorizedException } from '#exceptions';

const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '14d';

export class TokenProvider {
  #secret;

  constructor({ config }) {
    this.#secret = config.JWT_SECRET;
  }

  #sign(user, type, expiresIn) {
    return jwt.sign(
      { sub: String(user.id), nickname: user.nickname, type },
      this.#secret,
      { expiresIn },
    );
  }

  issueToken(user) {
    return this.#sign(user, 'access', ACCESS_TOKEN_EXPIRES_IN);
  }

  issueTokens(user) {
    return {
      accessToken: this.#sign(user, 'access', ACCESS_TOKEN_EXPIRES_IN),
      refreshToken: this.#sign(user, 'refresh', REFRESH_TOKEN_EXPIRES_IN),
    };
  }

  verifyToken(token) {
    try {
      const payload = jwt.verify(token, this.#secret);
      if (payload.type === 'refresh') {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
      }
      return payload;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }

  verifyRefreshToken(token) {
    try {
      const payload = jwt.verify(token, this.#secret);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      }
      return payload;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }
}
