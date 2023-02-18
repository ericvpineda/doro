import React, { useState, useEffect } from "react";
import generateChallenge from "../Utils/AuthUtils";
const random = require("random-string-generator");

// Helper object for argument into authentication functions 
const client = {
  id: encodeURIComponent("9b8675b2d72647fb9fdd3c06474cfde9"),
  scope: encodeURIComponent("streaming user-read-email user-read-currently-playing user-read-private user-modify-playback-state user-read-playback-state"),
  uri: chrome.identity.getRedirectURL(),
  state: encodeURIComponent(random(43)),
  authCode: "",
  challenge: "",
  verifier: "",
  refreshToken: "",
  player: undefined,
};

// Note: Type return elements for custom hooks
const useAuth = (): [boolean, () => void, () => void] => {
  const [signedIn, setSignedIn] = useState(false);
  const [refreshToken, setRefreshToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);

  // Build URL for request user authorization
  const createAuthURL = (client: any): string => {
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("client_id", client.id);
    url.searchParams.append("scope", client.scope);
    url.searchParams.append("redirect_uri", client.uri);
    url.searchParams.append("state", client.state);
    url.searchParams.append("code_challenge", client.challenge);
    // url.searchParams.append("show_dialog", "true");
    return url.href;
  };

  // Exchange authorization code for access token
  const requestAccessToken = async (client: any) => {
    const url = new URL("https://accounts.spotify.com/api/token");
    url.searchParams.append("grant_type", "authorization_code");
    url.searchParams.append("redirect_uri", client.uri);
    url.searchParams.append("client_id", client.id);
    url.searchParams.append("code", client.authCode);
    url.searchParams.append("code_verifier", client.verifier);
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

  const requestRefreshToken = async (client: any) => {
    const url = new URL("https://accounts.spotify.com/api/token");
    url.searchParams.append("grant_type", "refresh_token");
    url.searchParams.append("refresh_token", client.refreshToken);
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


  // Helper function to set user credentials
  const setAccessTokenHandler = (data: any) => {
    setRefreshToken(data.refresh_token);
    setExpiresIn(data.expires_in);
    setSignedIn(true);
    chrome.storage.local.set({
      signedIn: true,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      accessToken: data.access_token,
      endTime: data.expires_in * 1000 + new Date().getTime(),
      profileUrl: "",
    });
  };

  // Sign user out of Spotify
  const signOut = () => {
    chrome.storage.local.set({
      signedIn: false,
      refreshToken: "",
      expiresIn: "",
      accessToken: "",
      endTime: "",
      profileUrl: "",
    });
    setSignedIn(false);
  };

  // Launch user auth flow 
  const trySignIn = () => {
    if (!signedIn) {
      const [challenge, verifier] = generateChallenge();
      client.challenge = challenge;

      // Prompt user authorization
      chrome.identity.launchWebAuthFlow(
        { url: createAuthURL(client), interactive: true },
        (response) => {
          
          if (chrome.runtime.lastError) {
            console.log("error: " + chrome.runtime.lastError.message);
            return;
          }
          if (response == null) {
            console.log("error: response url is null");
            return;
          }
          // Note: URL allows get param after query variable
          const url = new URL(response);
          if (
            url.searchParams.has("error") ||
            url.searchParams.get("state") !== client.state
          ) {
            console.log("error: access_denied");
            return;
          }

          (client.authCode = url.searchParams.get("code")!),
            (client.verifier = verifier);
          requestAccessToken(client)
            .then((res) => res.json())
            .then((data) => {
              setAccessTokenHandler(data);
            })
            .catch((e) => {
              console.log(e);
              signOut();
            });
        }
      );
    }
  };
  
  // Update state variables upon opening extension
  useEffect(() => {
    chrome.storage.local.get(
      ["signedIn", "refreshToken", "expiresIn", "endTime"],
      (result) => {
        const currTime = new Date().getTime();
        if (result.signedIn && currTime < result.endTime) {
          setSignedIn(result.signedIn);
          setRefreshToken(result.refreshToken);
          setExpiresIn(result.expiresIn);
        }
      }
    );
  }, []);

  // update refresh token when token expires
  useEffect(() => {
    if (!refreshToken || !expiresIn || !signedIn) {
      return;
    }

    const timeout = setInterval(async () => {
      client.refreshToken = refreshToken;

      await requestRefreshToken(client)
        .then((res) => res.json())
        .then((data) => {
          setAccessTokenHandler(data);
        })
        .catch((e) => {
          console.log(e);
          signOut();
        });
    }, (expiresIn - 60) * 1000);
    return () => clearTimeout(timeout);
  }, [refreshToken, expiresIn]);

  return [signedIn, signOut, trySignIn];
};

export default useAuth;
