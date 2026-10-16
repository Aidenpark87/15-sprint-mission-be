import jwt from 'jsonwebtoken';
import { config } from '#config';
import { ERROR_MESSAGES } from '#constants';
import { UnauthorizedException } from '#errors';

const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '14d';

function sign(user, type, expiresIn) {
  return jwt.sign(
    { sub: String(user.id), nickname: user.nickname, type },
    config.JWT_SECRET,
    { expiresIn },
  );
}

export function issueToken(user) {
  return sign(user, 'access', ACCESS_TOKEN_EXPIRES_IN);
}

export function issueTokens(user) {
  return {
    accessToken: sign(user, 'access', ACCESS_TOKEN_EXPIRES_IN),
    refreshToken: sign(user, 'refresh', REFRESH_TOKEN_EXPIRES_IN),
  };
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (payload.type === 'refresh') {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
    return payload;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
  }
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
    return payload;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
  }
}
