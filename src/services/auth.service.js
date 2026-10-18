import { ERROR_MESSAGES } from '#constants';
import { ConflictException, UnauthorizedException } from '#exceptions';
import { canonicalizeEmail } from '#common/utils/email.js';

export class AuthService {
  #userRepository;
  #passwordProvider;
  #tokenProvider;

  constructor({ userRepository, passwordProvider, tokenProvider }) {
    this.#userRepository = userRepository;
    this.#passwordProvider = passwordProvider;
    this.#tokenProvider = tokenProvider;
  }

  async signUp({ email, nickname, password }) {
    const canonicalEmail = canonicalizeEmail(email);

    const existingEmail = await this.#userRepository.findByEmail(canonicalEmail);
    if (existingEmail) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_TAKEN);
    }

    const existingNickname = await this.#userRepository.findByNickname(nickname);
    if (existingNickname) {
      throw new ConflictException(ERROR_MESSAGES.NICKNAME_ALREADY_TAKEN);
    }

    const user = await this.#userRepository.create({
      email: canonicalEmail,
      nickname,
      image: null,
      encryptedPassword: await this.#passwordProvider.hash(password),
    });

    return {
      user: this.#toPublicUser(user),
      tokens: this.#tokenProvider.issueTokens(user),
    };
  }

  async signIn({ email, password }) {
    const user = await this.#userRepository.findByEmail(
      canonicalizeEmail(email),
    );
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_OR_PASSWORD_INVALID);
    }

    const passwordValid = await this.#passwordProvider.compare(
      password,
      user.encryptedPassword,
    );
    if (!passwordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_OR_PASSWORD_INVALID);
    }

    return {
      user: this.#toPublicUser(user),
      tokens: this.#tokenProvider.issueTokens(user),
    };
  }

  async getMe(userId) {
    const user = await this.#userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }

    return user;
  }

  async refreshTokens(refreshToken) {
    const payload = this.#tokenProvider.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await this.#userRepository.findById(Number(payload.sub));
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return { user, tokens: this.#tokenProvider.issueTokens(user) };
  }

  #toPublicUser(user) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
