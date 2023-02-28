import React, { FC, Fragment, useEffect, useState } from "react";
import Clock from "../Clock/Clock";
import FocusText from "../FocusText/FocusText";
import styles from "./Timer.module.css";
import SpotifyPlayer from "../SpotifyPlayer/SpotifyPlayer";
import Login from "../../Login/Login/Login";
import { ToggleOff, ToggleOn } from "react-bootstrap-icons";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";

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
    chrome.storage.local.get(["signedIn", "endTime", "showPlayer"], (res) => {
      let signedInCache = res.signedIn;
      if (
        signedInCache === undefined ||
        signedInCache === false ||
        res.endTime <= new Date().getTime()
      ) {
        signedInCache = false;
        chrome.storage.local.set({ signedIn: signedInCache });
      } else {
        setShowSwitch(true);
        setShowPlayer(res.showPlayer !== undefined ? res.showPlayer : true);
      }
      setSignedIn(signedInCache);
    });
  }, []);

  // Sets sign in status and switch boolean
  const setSignedInHandler = (value: boolean) => {
    setSignedIn(value);
    setShowSwitch(value);
  };

  // Renders switch for clock/music player icon
  const renderToggleSwitch = () => {
    chrome.storage.local.set({ showPlayer });
    if (showPlayer) {
      return (
        <Fragment>
          <div className={styles.switchText} data-testid="toggle-switch">Player</div>
          <ToggleOn
            className={styles.switch}
            onClick={() => setShowPlayer(false)}
          ></ToggleOn>
        </Fragment>
      );
    }
    return (
      <Fragment>
        <div className={styles.switchText}>Timer</div>
        <ToggleOff
          className={styles.switch}
          onClick={() => setShowPlayer(true)}
        />
      </Fragment>
    );
  };

  return (
    <Fragment>
      <div id="timer" className={styles.body}>
        {signedIn && showPlayer ? (
          <SpotifyPlayer setShowPlayerHandler={setShowPlayer} />
        ) : (
          <Clock />
        )}
        <FocusText />
      </div>
      <Login setSignedIn={setSignedInHandler}></Login>
      <ManageHistoryIcon
        fontSize={"large"}
        onClick={setShowTimer}
        className={styles.editButton}
      ></ManageHistoryIcon>
      {showSwitch && renderToggleSwitch()}
    </Fragment>
  );
};

export default Timer;
