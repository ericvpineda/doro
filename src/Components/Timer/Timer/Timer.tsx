import React, { FC, Fragment, useEffect, useState } from "react";
import Clock from "../Clock/Clock";
import FocusText from "../FocusText/FocusText";
import styles from "./Timer.module.css";
import { ToggleOff, ToggleOn } from "react-bootstrap-icons";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import { ChromeData } from "../../../Utils/ChromeUtils";

// Parent is App component
interface Prop {
  setShowTimerHandler: (param: boolean) => void;
}

// Timer component
const Timer: FC<Prop> = (props) => {
  const [signedIn, setSignedIn] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Toggle off Timer component in parent
  const setShowTimer = () => {
    props.setShowTimerHandler(false);
  };

  // Gets information whether to show toggle switch and spotify player
  useEffect(() => {
    chrome.storage.local.get(
      [ChromeData.signedIn, ChromeData.endTime, ChromeData.showPlayer],
      (res) => {
        let signedInCache = res.signedIn;
        // Check if user currently signed in or access_token still valid
        if (signedInCache || new Date().getTime() < res.endTime) {
          setShowSwitch(true);
          setShowPlayer(res.showPlayer !== undefined ? res.showPlayer : true);
        } else {
          signedInCache = false;
          chrome.storage.local.set({ signedIn: signedInCache });
        }
        setSignedIn(signedInCache);
      }
    );
  }, []);

  // Sets sign in status and switch boolean
  const setSignedInHandler = (value: boolean) => {
    setSignedIn(value);
    setShowSwitch(value);
  };

  // Toggle switch for clock/music player icon
  const renderToggleSwitch = () => {
    if (showPlayer) {
      chrome.storage.local.set({ showPlayer });
      return (
        <Fragment>
          <ToggleOn
            className={styles.switch}
            data-testid="toggle-switch-on"
            onClick={() => setShowPlayer(false)}
          />
          <div className={styles.switchText}>Player</div>
        </Fragment>
      );
    }
    return (
      <Fragment>
        <ToggleOff
          className={styles.switch}
          data-testid="toggle-switch-off"
          onClick={() => setShowPlayer(true)}
        />
        <div className={styles.switchText}>Timer</div>
      </Fragment>
    );
  };

  const setShowPlayerHandler = (value: boolean) => {
    setShowPlayer(value)
  }

  // Note: manageHistoryIcon is the edit clock input button
  return (
    <Fragment>
      <div id="timer" className={styles.body}>
        <Clock />
        <FocusText />
      </div>
      {/* <Login setSignedIn={setSignedInHandler} setShowPlayer={setShowPlayerHandler} /> */}
      <ManageHistoryIcon
        fontSize={"large"}
        onClick={setShowTimer}
        className={styles.editButton}
        data-testid="edit-button"
      />
      {showSwitch && renderToggleSwitch()}
    </Fragment>
  );
};

export default Timer;
