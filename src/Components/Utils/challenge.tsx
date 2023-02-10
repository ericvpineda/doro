const SHA256 = require("crypto-js/sha256");
const BASE64 = require("crypto-js/enc-base64");
const random = require("random-string-generator");

const generateChallenge = () => {
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
    url.searchParams.append("client_id", info.clientID);
    url.searchParams.append("state", info.state);
    url.searchParams.append("scope", info.scope);
    url.searchParams.append("redirect_uri", info.uri);
    url.searchParams.append("response_type", info.type);
    url.searchParams.append("show_dialog", info.dialog);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("code_challenge", info.codeChallenge);
    return url.href;
  };

  // Exchange authorization code for access token
  const requestAccessToken = async (info: any) => {
    const url = new URL("https://accounts.spotify.com/api/token");
    url.searchParams.append("grant_type", "authorization_code");
    url.searchParams.append("code", info.authCode);
    url.searchParams.append("code_verifier", info.codeVerifier);
    url.searchParams.append("redirect_uri", info.uri);
    url.searchParams.append("client_id", info.clientID);
    const params = new URLSearchParams(url.search);
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

      // Post request to get access tokenx
    const response = await fetch(url.href, {method: "POST", headers, body: params.toString()}).
        then((res) => res.json())
        .then((data) => console.log(data))
        .catch((e) => console.log(e));
}; 


export {generateChallenge, createAuthURL, requestAccessToken};