import React, { FC, useEffect, useState, Fragment } from "react";
import { Spotify } from "react-bootstrap-icons";
import styles from "./Login.module.css";
import Profile from "../Profile/Profile";
import useAuth from "../../../hooks/useAuth";

interface Props {
  setSignedIn: (signedIn: boolean) => void;
}

const Login: FC<Props> = (props) => {
  const [signedIn, signOut, trySignIn] = useAuth()

  useEffect(() => {
      props.setSignedIn(signedIn)
  }, [signedIn])
  
  return (
    <Fragment>
      {signedIn ? (
        <Profile signOut={signOut}></Profile>
      ) : (
        <Spotify
          onClick={trySignIn}
          className={styles.spotifyButton}
        ></Spotify>
      )}
    </Fragment>
  );
};

export default Login;
