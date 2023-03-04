import React, { FC, useEffect, useState, Fragment } from "react";
import { Spotify } from "react-bootstrap-icons";
import styles from "./Login.module.css";
import Profile from "../Profile/Profile";
import { Status, PlayerActions } from "../../../Utils/SpotifyUtils";
import { generateChallenge, random} from "../../../Utils/AuthUtils"
import {ChromeData} from "../../../Utils/ChromeUtils"

interface Props {
  setSignedIn: (signedIn: boolean) => void;
}

const Login: FC<Props> = (props) => {
  const [signedIn, setSignedIn] = useState(false)

  const trySignIn = () => {
    chrome.runtime.sendMessage({
      message: PlayerActions.SIGNIN,
      data: {
        state: encodeURIComponent(random(43)),
        challenge: generateChallenge()
      }
    }, (res) => {
      if (res.status === Status.SUCCESS) {
        setSignedIn(true)
        props.setSignedIn(true)
      } else if (res.status === Status.FAILURE) {
        // Note: This is case when user is already signed in
        console.log(res.message);
      } else if (res.status === Status.ERROR) {
        setSignedIn(false)
        props.setSignedIn(false)
        console.log(res.message);
      } else {
        setSignedIn(false)
        props.setSignedIn(false)
        console.log("Unknown error when pausing track.");
      }
    })
  }

  const signOut = () => {
    chrome.runtime.sendMessage({message: PlayerActions.SIGNOUT}, (res) => {
      if (res.status !== Status.SUCCESS) {
        console.log("Unknown error when signing user out");
      }
    })
    // Force sign out whether error or not
    setSignedIn(false);
    props.setSignedIn(false)
  }

  useEffect(() => {
    chrome.storage.local.get([ChromeData.signedIn], (res) => {
      if (res.signedIn) { 
        props.setSignedIn(res.signedIn);
        setSignedIn(res.signedIn)
      }
    })
  }, [])

  return (
    <Fragment>
      {signedIn ? (
        <Profile signOut={signOut}></Profile>
      ) : (
        <Spotify
        data-testid="spotify-button"
          onClick={trySignIn}
          className={styles.spotifyButton}
        ></Spotify>
      )}
    </Fragment>
  );
};

export default Login;
