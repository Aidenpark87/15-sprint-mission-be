import { ERROR_MESSAGES } from '#constants';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '#exceptions';

export class AuthService {
  #userRepository;
  #passwordProvider;
  #tokenProvider;
  #googleProvider;

  constructor({ userRepository, passwordProvider, tokenProvider, googleProvider }) {
    this.#userRepository = userRepository;
    this.#passwordProvider = passwordProvider;
    this.#tokenProvider = tokenProvider;
    this.#googleProvider = googleProvider;
  }

  async signUp({ email, nickname, password }) {
    const existingEmail = await this.#userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_TAKEN);
    }

    const existingNickname = await this.#userRepository.findByNickname(nickname);
    if (existingNickname) {
      throw new ConflictException(ERROR_MESSAGES.NICKNAME_ALREADY_TAKEN);
    }

    const user = await this.#userRepository.create({
      email,
      nickname,
      image: null,
      encryptedPassword: await this.#passwordProvider.hash(password),
    });

    return this.#tokenProvider.issueTokens(user);
  }

  async signIn({ email, password }) {
    const user = await this.#userRepository.findByEmail(email);
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

    return this.#tokenProvider.issueTokens(user);
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new BadRequestException(ERROR_MESSAGES.REFRESH_TOKEN_MISSING);
    }

    const payload = this.#tokenProvider.verifyRefreshToken(refreshToken);
    const user = await this.#userRepository.findById(Number(payload.sub));
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return this.#tokenProvider.issueTokens(user);
  }

  async signInWithGoogle({ code }) {
    if (!code) {
      throw new BadRequestException(ERROR_MESSAGES.GOOGLE_LOGIN_FAILED);
    }

    if (!this.#googleProvider.isConfigured()) {
      throw new BadRequestException(ERROR_MESSAGES.GOOGLE_LOGIN_UNAVAILABLE);
    }

    const profile = await this.#googleProvider.fetchProfile(code);
    if (!profile) {
      throw new UnauthorizedException(ERROR_MESSAGES.GOOGLE_LOGIN_FAILED);
    }

    const existing = await this.#userRepository.findByEmail(profile.email);

    const user =
      existing ??
      (await this.#userRepository.create({
        email: profile.email,
        nickname: await this.#buildUniqueNickname(profile.nickname),
        image: null,
        encryptedPassword: await this.#passwordProvider.hash(
          this.#randomPassword(),
        ),
      }));

    return this.#tokenProvider.issueTokens(user);
  }

  #randomPassword() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-google`;
  }

  async #buildUniqueNickname(base) {
    const trimmed = (base ?? '판다').slice(0, 20);
    const existing = await this.#userRepository.findByNickname(trimmed);
    if (!existing) {
      return trimmed;
    }

    return `${trimmed.slice(0, 14)}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
