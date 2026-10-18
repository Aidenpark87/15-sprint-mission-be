import { Buffer } from 'node:buffer';
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export class OAuthStateProvider {
  #secret;
  #clientBaseUrl;
  #now;
  #randomBytes;

  constructor(
    { oauthStateSecret, clientBaseUrl },
    { now = Date.now, randomBytesFn = randomBytes } = {},
  ) {
    this.#secret = oauthStateSecret;
    this.#clientBaseUrl = clientBaseUrl;
    this.#now = now;
    this.#randomBytes = randomBytesFn;
  }

  createState({ provider, next = '/' }) {
    const codeVerifier = this.#randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const payload = {
      provider,
      next: this.normalizeNextPath(next),
      transactionNonce: this.#randomBytes(32).toString('base64url'),
      codeChallenge,
      issuedAt: this.#now(),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );

    return {
      state: `${encodedPayload}.${this.#sign(encodedPayload)}`,
      transactionNonce: payload.transactionNonce,
      codeVerifier,
      codeChallenge,
    };
  }

  verifyState({ state, provider, transactionNonce, codeVerifier }) {
    if (!state || !provider || !transactionNonce || !codeVerifier) {
      return null;
    }

    const [encodedPayload, signature, ...extraParts] = state.split('.');
    if (!encodedPayload || !signature || extraParts.length > 0) {
      return null;
    }

    if (!safeEqual(signature, this.#sign(encodedPayload))) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      );
      const age = this.#now() - payload.issuedAt;
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      if (
        payload.provider !== provider ||
        !safeEqual(payload.transactionNonce, transactionNonce) ||
        !safeEqual(payload.codeChallenge, codeChallenge) ||
        !Number.isFinite(age) ||
        age < 0 ||
        age > STATE_TTL_MS
      ) {
        return null;
      }

      return {
        provider: payload.provider,
        next: this.normalizeNextPath(payload.next),
      };
    } catch {
      return null;
    }
  }

  normalizeNextPath(next) {
    if (typeof next !== 'string') {
      return '/';
    }

    const trimmed = next.trim();
    const hasControlCharacter = [...trimmed].some((character) => {
      const code = character.codePointAt(0);
      return code <= 0x1f || code === 0x7f;
    });
    if (
      !trimmed.startsWith('/') ||
      trimmed.startsWith('//') ||
      trimmed.includes('\\') ||
      hasControlCharacter
    ) {
      return '/';
    }

    try {
      const baseUrl = new URL(this.#clientBaseUrl);
      const targetUrl = new URL(trimmed, baseUrl);

      if (targetUrl.origin !== baseUrl.origin) {
        return '/';
      }

      return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    } catch {
      return '/';
    }
  }

  #sign(encodedPayload) {
    return createHmac('sha256', this.#secret)
      .update(encodedPayload)
      .digest('base64url');
  }
}
