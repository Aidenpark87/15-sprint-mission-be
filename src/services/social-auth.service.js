import { createHash } from 'node:crypto';
import { z } from 'zod';
import { config } from '#config';
import { ERROR_MESSAGES } from '#constants';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '#exceptions';
import { canonicalizeEmail } from '#common/utils/email.js';

const accessTokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

const googleProfileSchema = z.object({
  sub: z.string().min(1),
  email: z.email().nullable().optional(),
  email_verified: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

const kakaoProfileSchema = z.object({
  id: z.union([z.string().min(1), z.number().finite()]),
  kakao_account: z
    .object({
      email: z.email().nullable().optional(),
      is_email_valid: z.boolean().optional(),
      is_email_verified: z.boolean().optional(),
      profile: z.object({ nickname: z.string().min(1).optional() }).optional(),
    })
    .optional(),
  properties: z.object({ nickname: z.string().min(1).optional() }).optional(),
});

export class SocialAuthService {
  #userRepository;
  #passwordProvider;
  #tokenProvider;

  constructor({ userRepository, passwordProvider, tokenProvider }) {
    this.#userRepository = userRepository;
    this.#passwordProvider = passwordProvider;
    this.#tokenProvider = tokenProvider;
  }

  isConfigured(provider) {
    const credentials = {
      google: [config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET],
      kakao: [config.KAKAO_CLIENT_ID, config.KAKAO_CLIENT_SECRET],
    }[provider];

    return Boolean(credentials?.every((value) => Boolean(value)));
  }

  async loginOrSignUp({ provider, code, state, codeVerifier }) {
    const profile = await this.#getSocialProfile(
      provider,
      code,
      state,
      codeVerifier,
    );
    const user = await this.#resolveUser({ provider, profile });
    const tokens = this.#tokenProvider.issueTokens(user);

    return { user, tokens };
  }

  async #resolveUser({ provider, profile }) {
    const socialUser = await this.#userRepository.findBySocialAccount(
      provider,
      profile.id,
    );
    if (socialUser) {
      return socialUser;
    }

    const email = this.#resolveEmail({ provider, profile });
    const existingUser = profile.emailVerified
      ? await this.#userRepository.findByEmail(email)
      : null;

    if (existingUser) {
      throw new ConflictException(
        ERROR_MESSAGES.SOCIAL_ACCOUNT_LINK_REQUIRED,
      );
    }

    return this.#userRepository.createWithSocialAccount({
      email,
      nickname: await this.#buildUniqueNickname(profile.name),
      encryptedPassword: await this.#passwordProvider.hash(
        this.#randomPassword(),
      ),
      provider,
      providerId: profile.id,
    });
  }

  async #getSocialProfile(provider, code, state, codeVerifier) {
    switch (provider) {
      case 'google':
        return this.#getGoogleProfile(code, codeVerifier);
      case 'kakao':
        return this.#getKakaoProfile(code, codeVerifier);
      default:
        throw new BadRequestException(
          ERROR_MESSAGES.UNSUPPORTED_SOCIAL_PROVIDER,
        );
    }
  }

  async #getGoogleProfile(code, codeVerifier) {
    const callbackUri = `${config.API_BASE_URL}/api/auth/social/callback/google`;

    const tokenResponse = this.#parseSocialResponse(
      accessTokenResponseSchema,
      await this.#requestSocialJson('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID,
          client_secret: config.GOOGLE_CLIENT_SECRET,
          redirect_uri: callbackUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }),
      }),
    );

    const profileResponse = this.#parseSocialResponse(
      googleProfileSchema,
      await this.#requestSocialJson(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      ),
    );

    return {
      id: String(profileResponse.sub),
      email: profileResponse.email ?? null,
      emailVerified: profileResponse.email_verified === true,
      name: profileResponse.name ?? '판다',
    };
  }

  async #getKakaoProfile(code, codeVerifier) {
    const callbackUri = `${config.API_BASE_URL}/api/auth/social/callback/kakao`;

    const tokenResponse = this.#parseSocialResponse(
      accessTokenResponseSchema,
      await this.#requestSocialJson('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.KAKAO_CLIENT_ID,
          client_secret: config.KAKAO_CLIENT_SECRET,
          redirect_uri: callbackUri,
          code,
          code_verifier: codeVerifier,
        }),
      }),
    );

    const profileResponse = this.#parseSocialResponse(
      kakaoProfileSchema,
      await this.#requestSocialJson('https://kapi.kakao.com/v2/user/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
        body: new URLSearchParams(),
      }),
    );

    const nickname =
      profileResponse.kakao_account?.profile?.nickname ??
      profileResponse.properties?.nickname ??
      '판다';

    return {
      id: String(profileResponse.id),
      email: profileResponse.kakao_account?.email ?? null,
      emailVerified:
        profileResponse.kakao_account?.is_email_valid === true &&
        profileResponse.kakao_account?.is_email_verified === true,
      name: nickname,
    };
  }

  #resolveEmail({ provider, profile }) {
    if (profile.email && profile.emailVerified) {
      return canonicalizeEmail(profile.email);
    }

    const socialIdentityDigest = createHash('sha256')
      .update(`${provider}:${String(profile.id)}`)
      .digest('base64url');

    return `${provider}_${socialIdentityDigest}@social.local`;
  }

  async #buildUniqueNickname(base) {
    const trimmed = (base ?? '판다').slice(0, 20);
    const existing = await this.#userRepository.findByNickname(trimmed);

    if (!existing) {
      return trimmed;
    }

    return `${trimmed.slice(0, 14)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  #randomPassword() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-social`;
  }

  #parseSocialResponse(schema, payload) {
    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new UnauthorizedException(ERROR_MESSAGES.SOCIAL_AUTH_FAILED);
    }

    return result.data;
  }

  async #requestSocialJson(url, options) {
    const response = await fetch(url, options);
    const rawText = await response.text();
    let payload = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      throw new UnauthorizedException(ERROR_MESSAGES.SOCIAL_AUTH_FAILED);
    }

    return payload;
  }
}
