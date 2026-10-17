const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export class GoogleProvider {
  #config;

  constructor({ config }) {
    this.#config = config;
  }

  isConfigured() {
    return Boolean(
      this.#config.GOOGLE_CLIENT_ID &&
        this.#config.GOOGLE_CLIENT_SECRET &&
        this.#config.GOOGLE_REDIRECT_URI,
    );
  }

  async fetchProfile(code) {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.#config.GOOGLE_CLIENT_ID,
        client_secret: this.#config.GOOGLE_CLIENT_SECRET,
        redirect_uri: this.#config.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return null;
    }

    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) {
      return null;
    }

    const profileResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      return null;
    }

    const profile = await profileResponse.json();
    if (!profile?.email) {
      return null;
    }

    return {
      email: profile.email,
      nickname: profile.name ?? profile.email.split('@')[0],
    };
  }
}
