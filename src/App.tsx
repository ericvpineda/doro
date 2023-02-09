import React, { FC, Fragment, useEffect, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import styles from "./App.module.css";
import { GearFill, ArrowRightCircle, Spotify } from "react-bootstrap-icons";
const SHA256 = require("crypto-js/sha256");
const BASE64 = require("crypto-js/enc-base64");
const random = require("random-string-generator");

const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);

  // Set current window
  const onClickHandler = () => {
    setShowTimer(!showTimer);
  };

  const generateChallenge = () => {
    const verfier = random(64);
    const codeChallenge = BASE64.stringify(SHA256(verfier))
      .replace(/\+/g, "_")
      .replace(/\//g, "_")
      .replace(/=/g, "");
      return [codeChallenge, verfier];

  };

  const spotifyBtnHandler = () => {
    chrome.runtime.sendMessage({
      message: "signin",
      challenge: generateChallenge(),
    });
  };

  console.log("Running: App.js");

  return (
    <Fragment>
      <Spotify
        onClick={spotifyBtnHandler}
        className={styles.spotifyButton}
      ></Spotify>
      {!showTimer ? (
        <>
          <UserInput setShowTimerHandler={setShowTimer}></UserInput>
          <ArrowRightCircle
            onClick={onClickHandler}
            className={styles.clockButton}
          ></ArrowRightCircle>
        </>
      ) : (
        <>
          <Timer />
          <GearFill
            onClick={onClickHandler}
            className={styles.editButton}
          ></GearFill>
        </>
      )}
    </Fragment>
  );
};

export default App;
