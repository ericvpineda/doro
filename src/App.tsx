import React, { FC, Fragment, useEffect, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import styles from "./App.module.css";
import { GearFill, ArrowRightCircle, Spotify } from "react-bootstrap-icons";


const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);

  // Set current window
  const onClickHandler = () => {
    setShowTimer(!showTimer);
  };

  const spotifyBtnHandler = () => {
    chrome.runtime.sendMessage({message: "login"});
  };

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
