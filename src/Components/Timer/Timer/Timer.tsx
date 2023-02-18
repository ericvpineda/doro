import React, { FC, Fragment, useEffect, useState } from "react";
import Clock from "../Clock/Clock";
import FocusText from "../FocusText/FocusText";
import styles from "./Timer.module.css";
import SpotifyPlayer from "../SpotifyPlayer/SpotifyPlayer";
import Login from "../../Login/Login/Login";
import { GearFill } from "react-bootstrap-icons";

interface Prop {
  setShowTimerHandler: (param: boolean) => void;
}

const Timer: FC<Prop> = (props) => {
  const [signedIn, setSignedIn] = useState(false);

  const setShowTimer = () => {
    props.setShowTimerHandler(false);
  };

  useEffect(() => {
    chrome.storage.local.get(["signedIn", "endTime", "accessToken"], (res) => {
      let cacheSignedIn = res.signedIn;
      if (res.accessToken === "" || res.endTime <= new Date().getTime()) {
        cacheSignedIn = false;
        chrome.storage.local.set({ signedIn: cacheSignedIn });
      }
      setSignedIn(cacheSignedIn);
    });
  }, []);

  return (
    <Fragment>
      <Login setSignedIn={setSignedIn}></Login>
      <div className={styles.body}>
        {signedIn ? <SpotifyPlayer></SpotifyPlayer> : <Clock></Clock>}
        <FocusText></FocusText>
      </div>
      <GearFill onClick={setShowTimer} className={styles.editButton}></GearFill>
    </Fragment>
  );
};

export default Timer;
