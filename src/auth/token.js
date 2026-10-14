import jwt from 'jsonwebtoken';
import { config } from '#config';
import { ERROR_MESSAGES } from '#constants';
import { UnauthorizedException } from '#errors';

const TOKEN_EXPIRES_IN = '7d';

export function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id), nickname: user.nickname },
    config.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
  }
}
