import React, { FC, Fragment, useEffect, useState } from "react";
import Clock from "../Clock/Clock";
import FocusText from "../FocusText/FocusText";
import styles from "./Timer.module.css";
import SpotifyPlayer from "../SpotifyPlayer/SpotifyPlayer";
import Login from "../../Login/Login/Login";
import { GearFill, ToggleOff, ToggleOn } from "react-bootstrap-icons";

interface Prop {
  setShowTimerHandler: (param: boolean) => void;
}

const Timer: FC<Prop> = (props) => {
  const [signedIn, setSignedIn] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const setShowTimer = () => {
    props.setShowTimerHandler(false);
  };

  useEffect(() => {
    chrome.storage.local.get(["signedIn", "endTime", "accessToken"], (res) => {
      let cacheSignedIn = res.signedIn;
      if (res.accessToken === "" || res.endTime <= new Date().getTime()) {
        cacheSignedIn = false;
        chrome.storage.local.set({ signedIn: cacheSignedIn });
      } else {
        setShowSwitch(true)
        setShowPlayer(true)
      }
      setSignedIn(cacheSignedIn);
    });
  }, []);

  // Sets sign in status and switch boolean
  const setSignedInHandler = (value: boolean) => {
    setSignedIn(value)
    setShowSwitch(value)
  }

  // Renders switch for clock/music player icon
  const renderSwitch = () => {
    if (showPlayer) {
      return <ToggleOn className={styles.switch} onClick={() => setShowPlayer(false)} ></ToggleOn>
    }
    return <ToggleOff className={styles.switch} onClick={() => setShowPlayer(true)} />
  }

  return (
    <Fragment>
      <Login setSignedIn={setSignedInHandler}></Login>
      <div id="timer" className={styles.body}>
        {signedIn && showPlayer ? <SpotifyPlayer></SpotifyPlayer> : <Clock></Clock>}
        <FocusText></FocusText>
      </div>
      <GearFill onClick={setShowTimer} className={styles.editButton}></GearFill>
      {showSwitch && renderSwitch()}
    </Fragment>
  );
};

export default Timer;
