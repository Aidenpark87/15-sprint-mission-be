import { ERROR_MESSAGES } from '#constants';
import { UnauthorizedException } from '#errors';
import { userRepository } from '#repositories';
import { verifyToken } from '#auth/token.js';

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

async function authenticate(req) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw new UnauthorizedException(ERROR_MESSAGES.ACCESS_TOKEN_MISSING);
  }

  const payload = verifyToken(token);
  const user = await userRepository.findById(Number(payload.sub));
  if (!user) {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
  }

  return user;
}

export async function requireAuth(req, _res, next) {
  try {
    req.user = await authenticate(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      req.user = await authenticate(req);
    }
  } catch {
    req.user = undefined;
  }

  next();
}
