import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

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

  verifyAccessToken(token) {
    return this.#verify(token, 'access');
  }

  verifyRefreshToken(token) {
    return this.#verify(token, 'refresh');
  }

  #verify(token, expectedType) {
    try {
      const payload = jwt.verify(token, this.#secret);
      return payload.type === expectedType ? payload : null;
    } catch {
      return null;
    }
  }
}
