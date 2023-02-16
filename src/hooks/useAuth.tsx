import React, { useState, useEffect } from "react";
const random = require("random-string-generator");
import {
  generateChallenge,
  createAuthURL,
  requestAccessToken,
  requestRefreshToken,
} from "../Utils/SpotifyAuthUtils";

const info = {
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

  const trySignIn = () => {
    if (!signedIn) {
      const [challenge, verifier] = generateChallenge();
      info.challenge = challenge;

      // Prompt user authorization
      chrome.identity.launchWebAuthFlow(
        { url: createAuthURL(info), interactive: true },
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
            url.searchParams.get("state") !== info.state
          ) {
            console.log("error: access_denied");
            return;
          }

          (info.authCode = url.searchParams.get("code")!),
            (info.verifier = verifier);
          requestAccessToken(info)
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

  useEffect(() => {
    if (!refreshToken || !expiresIn || !signedIn) {
      return;
    }

    const timeout = setInterval(async () => {
      info.refreshToken = refreshToken;

      await requestRefreshToken(info)
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

  return [signedIn, signOut, trySignIn];
};

export default useAuth;
