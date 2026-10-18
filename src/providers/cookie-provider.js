import { isProduction } from '#config';
import { DAY_IN_MS, MINUTE_IN_MS } from '#constants';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * MINUTE_IN_MS;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * DAY_IN_MS;
const OAUTH_TRANSACTION_MAX_AGE_MS = 10 * MINUTE_IN_MS;
const OAUTH_TRANSACTION_PATH = '/api/auth/social/callback';

const sameSite = isProduction ? 'none' : 'lax';

export class CookieProvider {
  setAuthCookies(res, tokens) {
    const { accessToken, refreshToken } = tokens;
    const secure = isProduction;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      path: '/',
    });
  }

  clearAuthCookies(res) {
    const options = { path: '/', sameSite, secure: isProduction };
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);
  }

  setOAuthTransactionCookies(res, { transactionNonce, codeVerifier }) {
    const options = {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: OAUTH_TRANSACTION_MAX_AGE_MS,
      path: OAUTH_TRANSACTION_PATH,
    };

    res.cookie('oauthTransactionNonce', transactionNonce, options);
    res.cookie('oauthCodeVerifier', codeVerifier, options);
  }

  getOAuthTransactionNonce(req) {
    return req.cookies?.oauthTransactionNonce ?? null;
  }

  getOAuthCodeVerifier(req) {
    return req.cookies?.oauthCodeVerifier ?? null;
  }

  clearOAuthTransactionCookies(res) {
    const options = { path: OAUTH_TRANSACTION_PATH, sameSite, secure: isProduction };
    res.clearCookie('oauthTransactionNonce', options);
    res.clearCookie('oauthCodeVerifier', options);
  }
}
