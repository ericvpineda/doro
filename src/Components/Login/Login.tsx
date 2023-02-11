import React, { FC, useEffect, useState } from "react";
import { Spotify } from "react-bootstrap-icons";
import styles from "./Login.module.css";
import {
  generateChallenge,
  createAuthURL,
  requestAccessToken,
  requestRefreshToken,
} from "../Utils/SpotifyAuthUtils";

const random = require("random-string-generator");
const info = {
    state: encodeURIComponent(random(43)),
    authCode: "",
    challenge: "",
    verifier: "",
    refreshToken: "",
}

interface Props {
  setAccessTokenHandler: (param: string) => void;
}

const Login: FC<Props> = (props) => {
  const [signedIn, setSignedIn] = useState(false);
  const [refreshToken, setRefreshToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);

  const setAccessTokenHandler = (data: any) => {
    setRefreshToken(data.refresh_token);
    setExpiresIn(data.expires_in);
    setSignedIn(true);
    props.setAccessTokenHandler(data.access_token);
  };

  const spotifyBtnHandler = () => {
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

          info.authCode = url.searchParams.get("code")!,
          info.verifier = verifier
          requestAccessToken(info)
            .then((res) => res.json())
            .then((data) => {
              setAccessTokenHandler(data);
            })
            .catch((e) => console.log(e));
        }
      );
    }
  };

  useEffect(() => {
    if (!refreshToken || !expiresIn) {
      return;
    }

    const timeout = setInterval(async () => {
     info.refreshToken = refreshToken;

      await requestRefreshToken(info)
        .then((res) => res.json())
        .then((data) => {
          setAccessTokenHandler(data);
        })
        .catch((e) => console.log(e));
    }, (expiresIn - 60) * 1000);
    return () => clearTimeout(timeout);
  }, [refreshToken, expiresIn]);

  return (
    <Spotify
      onClick={spotifyBtnHandler}
      className={styles.spotifyButton}
    ></Spotify>
  );
};

export default Login;
