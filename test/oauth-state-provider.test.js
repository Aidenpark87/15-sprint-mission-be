import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { OAuthStateProvider } from '../src/providers/oauth-state-provider.js';

const NOW = 1_800_000_000_000;

const createProvider = ({ now = NOW } = {}) =>
  new OAuthStateProvider(
    {
      oauthStateSecret: 'test-secret-that-is-longer-than-32-characters',
      clientBaseUrl: 'http://localhost:3000',
    },
    {
      now: () => now,
      randomBytesFn: () => Buffer.alloc(32, 1),
    },
  );

test('state에 담긴 provider·transactionNonce·PKCE verifier 가 모두 맞아야 통과한다', () => {
  const provider = createProvider();
  const { state, transactionNonce, codeVerifier, codeChallenge } =
    provider.createState({
      provider: 'google',
      next: '/products?sort=latest#list',
    });

  assert.equal(codeVerifier.length, 43);
  assert.equal(codeChallenge.length, 43);
  assert.deepEqual(
    provider.verifyState({
      state,
      provider: 'google',
      transactionNonce,
      codeVerifier,
    }),
    {
      provider: 'google',
      next: '/products?sort=latest#list',
    },
  );
});

test('state·nonce·verifier·provider 가 하나라도 변조되면 거부한다', () => {
  const provider = createProvider();
  const { state, transactionNonce, codeVerifier } = provider.createState({
    provider: 'google',
    next: '/',
  });

  assert.equal(
    provider.verifyState({
      state: `${state}tampered`,
      provider: 'google',
      transactionNonce,
      codeVerifier,
    }),
    null,
  );
  assert.equal(
    provider.verifyState({
      state,
      provider: 'google',
      transactionNonce: 'other',
      codeVerifier,
    }),
    null,
  );
  assert.equal(
    provider.verifyState({
      state,
      provider: 'google',
      transactionNonce,
      codeVerifier: 'different-code-verifier',
    }),
    null,
  );
  assert.equal(
    provider.verifyState({
      state,
      provider: 'kakao',
      transactionNonce,
      codeVerifier,
    }),
    null,
  );
});

test('10분이 지난 state 는 만료로 거부한다', () => {
  const issuingProvider = createProvider();
  const { state, transactionNonce, codeVerifier } = issuingProvider.createState(
    {
      provider: 'kakao',
      next: '/',
    },
  );
  const verifyingProvider = createProvider({
    now: NOW + 10 * 60 * 1000 + 1,
  });

  assert.equal(
    verifyingProvider.verifyState({
      state,
      provider: 'kakao',
      transactionNonce,
      codeVerifier,
    }),
    null,
  );
});

test('외부 주소·프로토콜 상대 주소 같은 위험한 next 는 루트로 정규화한다', () => {
  const provider = createProvider();

  assert.equal(provider.normalizeNextPath('https://evil.example'), '/');
  assert.equal(provider.normalizeNextPath('//evil.example'), '/');
  assert.equal(provider.normalizeNextPath('/\\evil.example'), '/');
  assert.equal(provider.normalizeNextPath('/dashboard'), '/dashboard');
});
