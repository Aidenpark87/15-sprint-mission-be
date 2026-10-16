import { ERROR_MESSAGES } from '#constants';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '#errors';
import { userRepository } from '#repositories';
import { hashPassword, verifyPassword } from '#auth/password.js';
import { issueTokens, verifyRefreshToken } from '#auth/token.js';
import { fetchGoogleProfile, isGoogleLoginConfigured } from '#auth/google.js';

function randomPassword() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-google`;
}

async function buildUniqueNickname(base) {
  const trimmed = (base ?? '판다').slice(0, 20);
  const existing = await userRepository.findByNickname(trimmed);
  if (!existing) {
    return trimmed;
  }

  return `${trimmed.slice(0, 14)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function signUp({ email, nickname, password }) {
  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) {
    throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_TAKEN);
  }

  const existingNickname = await userRepository.findByNickname(nickname);
  if (existingNickname) {
    throw new ConflictException(ERROR_MESSAGES.NICKNAME_ALREADY_TAKEN);
  }

  const user = await userRepository.create({
    email,
    nickname,
    image: null,
    encryptedPassword: await hashPassword(password),
  });

  return issueTokens(user);
}

async function signIn({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_OR_PASSWORD_INVALID);
  }

  const passwordValid = await verifyPassword(password, user.encryptedPassword);
  if (!passwordValid) {
    throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_OR_PASSWORD_INVALID);
  }

  return issueTokens(user);
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new BadRequestException(ERROR_MESSAGES.REFRESH_TOKEN_MISSING);
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await userRepository.findById(Number(payload.sub));
  if (!user) {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  return issueTokens(user);
}

async function signInWithGoogle({ code }) {
  if (!code) {
    throw new BadRequestException(ERROR_MESSAGES.GOOGLE_LOGIN_FAILED);
  }

  if (!isGoogleLoginConfigured()) {
    throw new BadRequestException(ERROR_MESSAGES.GOOGLE_LOGIN_UNAVAILABLE);
  }

  const profile = await fetchGoogleProfile(code);
  if (!profile) {
    throw new UnauthorizedException(ERROR_MESSAGES.GOOGLE_LOGIN_FAILED);
  }

  const existing = await userRepository.findByEmail(profile.email);

  const user =
    existing ??
    (await userRepository.create({
      email: profile.email,
      nickname: await buildUniqueNickname(profile.nickname),
      image: null,
      encryptedPassword: await hashPassword(randomPassword()),
    }));

  return issueTokens(user);
}

export const authService = {
  signUp,
  signIn,
  refresh,
  signInWithGoogle,
};
