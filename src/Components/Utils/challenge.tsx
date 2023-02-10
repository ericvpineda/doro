const SHA256 = require("crypto-js/sha256");
const BASE64 = require("crypto-js/enc-base64");
const random = require("random-string-generator");
const client = {
  id: encodeURIComponent("a1794c4b3ff54d829531b3941ecf5620"),
  scope: encodeURIComponent("user-read-private user-read-email"),
  uri: chrome.identity.getRedirectURL(),
  type: encodeURIComponent("code"),
  dialog: encodeURIComponent("true"),
}

const generateChallenge = (): [string, string] => {
    const codeVerifier = random(64);
    const codeChallenge = BASE64.stringify(SHA256(codeVerifier))
        .replace(/\+/g, "_")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    return [codeChallenge, codeVerifier];
};

 // Build URL for request user authorization 
 const createAuthURL = (info: any): string => {
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.append("client_id", client.id);
    url.searchParams.append("state", info.state);
    url.searchParams.append("scope", client.scope);
    url.searchParams.append("redirect_uri", client.uri);
    url.searchParams.append("response_type", client.type);
    url.searchParams.append("show_dialog", client.dialog);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("code_challenge", info.challenge);
    return url.href;
  };

  // Exchange authorization code for access token
  const requestAccessToken = async (info: any) => {
    const url = new URL("https://accounts.spotify.com/api/token");
    url.searchParams.append("grant_type", "authorization_code");
    url.searchParams.append("code", info.authCode);
    url.searchParams.append("code_verifier", info.verifier);
    url.searchParams.append("redirect_uri", client.uri);
    url.searchParams.append("client_id", client.id);
    const params = new URLSearchParams(url.search);
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

      // Post request to get access tokenx
    return await fetch(url.href, {method: "POST", headers, body: params.toString()})
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
        return await fetch(url.href, {method: "POST", headers, body: params.toString()})
    }


export {generateChallenge, createAuthURL, requestAccessToken, requestRefreshToken};