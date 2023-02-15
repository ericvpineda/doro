import pkceChallenge from "pkce-challenge";

const client = {
  id: encodeURIComponent("9b8675b2d72647fb9fdd3c06474cfde9"),
  scope: encodeURIComponent("streaming user-read-email user-read-currently-playing user-read-private user-modify-playback-state user-read-playback-state"),
  uri: chrome.identity.getRedirectURL(),
};

const generateChallenge = (): [string, string] => {
  const {code_verifier, code_challenge} = pkceChallenge(64);
  return [code_challenge, code_verifier];
};

// Build URL for request user authorization
const createAuthURL = (info: any): string => {
  const url = new URL("https://accounts.spotify.com/authorize");
  // url.searchParams.append("show_dialog", "true");
  url.searchParams.append("response_type", "code");
  url.searchParams.append("code_challenge_method", "S256");
  url.searchParams.append("client_id", client.id);
  url.searchParams.append("scope", client.scope);
  url.searchParams.append("redirect_uri", client.uri);
  url.searchParams.append("state", info.state);
  url.searchParams.append("code_challenge", info.challenge);
  return url.href;
};

// Exchange authorization code for access token
const requestAccessToken = async (info: any) => {
  const url = new URL("https://accounts.spotify.com/api/token");
  url.searchParams.append("grant_type", "authorization_code");
  url.searchParams.append("redirect_uri", client.uri);
  url.searchParams.append("client_id", client.id);
  url.searchParams.append("code", info.authCode);
  url.searchParams.append("code_verifier", info.verifier);
  const params = new URLSearchParams(url.search);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // Post request to get access tokenx
  return await fetch(url.href, {
    method: "POST",
    headers,
    body: params.toString(),
  });
};

const requestRefreshToken = async (info: any) => {
  const url = new URL("https://accounts.spotify.com/api/token");
  url.searchParams.append("grant_type", "refresh_token");
  url.searchParams.append("refresh_token", info.refreshToken);
  url.searchParams.append("client_id", client.id);
  const params = new URLSearchParams(url.search);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  return await fetch(url.href, {
    method: "POST",
    headers,
    body: params.toString(),
  });
};

export {
  generateChallenge,
  createAuthURL,
  requestAccessToken,
  requestRefreshToken,
};
