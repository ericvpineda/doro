import React, { FC, useState } from "react";
import { Spotify } from "react-bootstrap-icons";
import styles from "./Login.module.css";
import {generateChallenge, createAuthURL, requestAccessToken} from "../Utils/challenge";
// import useAuth from "../Hooks/useAuth";
const random = require("random-string-generator");

interface Props {
  setAccessTokenHandler: (param: string) => void;
}

const Login: FC<Props> = (props) => {
    const [signedIn, setSignedIn] = useState(false);
    const [accessToken, setAccessToken] = React.useState("");
    const [refreshToken, setRefreshToken] = React.useState("");
    const [expiresIn, setExpiresIn] = React.useState("");
    const client = {
        clientID: encodeURIComponent("a1794c4b3ff54d829531b3941ecf5620"),
        state: encodeURIComponent(random(43)),
        scope: encodeURIComponent("user-read-private user-read-email"),
        uri: chrome.identity.getRedirectURL(),
        type: encodeURIComponent("code"),
        dialog: encodeURIComponent("true"),
        codeChallenge: "",
        codeVerifier: "",
        authCode: ""
    }

    const spotifyBtnHandler = () => {
        const [codeChallenge, codeVerifier] = generateChallenge();
        client.codeChallenge = codeChallenge;
        const url = createAuthURL(client);
        chrome.identity.launchWebAuthFlow({url, interactive: true}, (response) => {
            if (chrome.runtime.lastError) {
                console.log("error: " + chrome.runtime.lastError.message);
                return;
            }
            if (response == null) {
                console.log("error: response url is null");
                return;
            }
            // Note: URL allows get param after query variable
            const url = new URL(response)
            if (url.searchParams.has("error") || url.searchParams.get("state") !== client.state) {
                console.log("error: access_denied");
                return;
            }
            client.authCode = url.searchParams.get("code")!
            client.codeVerifier = codeVerifier;
            requestAccessToken(client)
        });
    };

  return (
    <Spotify onClick={spotifyBtnHandler} className={styles.spotifyButton}></Spotify>
  );
};

export default Login;
