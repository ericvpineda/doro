import React, { FC, useEffect, useState, Fragment, useContext } from "react";
import DescriptContext from "../../../hooks/DescriptContext";
import styles from "./Clock.module.css";
import {
  PlayFill,
  PauseFill,
  XCircleFill,
  ArrowCounterclockwise,
} from "react-bootstrap-icons";
import {ChromeData} from "../../../Utils/ChromeUtils";

const Clock: FC = () => {
  const [isRunning, setIsRunning] = useState(false); // Clock pause/play state
  const [isExecutingRequest, setIsExecutingRequest] = useState(false); // Clock current has reques
  const ctx = useContext(DescriptContext); // Holds state of description boolean
  const [timer, setTimer] = useState({
    // Timer state
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Helper function to update clock time and effects
  const progressRing = document.getElementById("timer-outer")! as HTMLElement;

  // Helper function to update clock values from storage
  const updateTime = () => {
    chrome.storage.local.get(
      [
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.setTime,
        ChromeData.isExecutingRequest,
      ],
      (res) => {
        let degree = 0;

        if (res.isExecutingRequest) {
          // Update clock time ui
          const hours: string =
            res.hours >= 10 ? res.hours.toString() : "0" + res.hours;
          const minutes: string =
            res.minutes >= 10 ? res.minutes.toString() : "0" + res.minutes;
          const seconds: string =
            res.seconds >= 10 ? res.seconds.toString() : "0" + res.seconds;
          setTimer({ hours, minutes, seconds });
          const curr_time: number =
            res.hours * 3600 + res.minutes * 60 + res.seconds;
          const end_time: number =
            res.setTime.hours * 3600 + res.setTime.minutes * 60;

          // Update clock fill degree
          degree = 360 - (curr_time / end_time) * 360;
        } else {
          setTimer({ hours: "00", minutes: "00", seconds: "00" });
        }

        if (progressRing) {
          progressRing.style.background = `conic-gradient(
                         lightgreen ${degree}deg,
                         #212529 ${degree}deg 
                     )`;
        }
      }
    );
  };

  // Update start / pause button on clock gui
  const setIsRunningHandler = () => {
    chrome.storage.local.get([ChromeData.isExecutingRequest], (res) => {
      if (res.isExecutingRequest) {
        chrome.storage.local.set({ isRunning: !isRunning });
        setIsRunning(!isRunning);
      }
    });
  };

  // Clears storage cache and timer state
  const clearTimer = () => {
    chrome.storage.local.set({
      description: "",
      setTime: {},
      hours: 0,
      minutes: 0,
      seconds: 0,
      isRunning: false,
      isExecutingRequest: false,
    });
    setIsRunning(false);
    setIsExecutingRequest(false);
    // Set show description boolean to false
    ctx.hideDescription();
  };

  // Reverts timer back to original pre-set time
  const resetTimer = () => {
    chrome.storage.local.get([ChromeData.setTime], (res) => {
      const setTime = res.setTime;
      chrome.storage.local.set({
        hours: setTime.hours,
        minutes: setTime.minutes,
        seconds: 0,
        isRunning: false,
      });
    });
    setIsRunning(false);
    updateTime(); // Needed to make test pass?
  };

  // Initial re-render (allow initial set timer to show up)
  useEffect(() => {
    chrome.storage.local.get(
      [ChromeData.isRunning, ChromeData.isExecutingRequest],
      (res) => {
        if (res.isExecutingRequest === true) {
          setIsRunning(res.isRunning);
          setIsExecutingRequest(true);
        }
      }
    );
    updateTime();
  }, [isExecutingRequest, isRunning]);

  // Update time for each time seconds variable is updated
  useEffect(() => {
    chrome.storage.onChanged.addListener(() => {
      updateTime();
    });
  }, [isExecutingRequest]); // Needed to updated radial background color each second

  return (
    <div id="timer-outer" className={styles.timerOuter}>
      <div className={styles.timerRing} onClick={setIsRunningHandler}>
        <div className={styles.timer}>
          <span id="hours" data-testid="test-hours">
            {timer.hours}
          </span>
          <span>:</span>
          <span id="minutes" data-testid="test-minutes">
            {timer.minutes}
          </span>
          <span>:</span>
          <span id="seconds" data-testid="test-seconds">
            {timer.seconds}
          </span>
        </div>
      </div>
      {isExecutingRequest && (
        <Fragment>
          <XCircleFill
            data-testid="clear-btn"
            className={styles.clearButton}
            onClick={clearTimer}
          ></XCircleFill>
          {!isRunning ? (
            <PlayFill
              data-testid="play-btn"
              className={styles.timerControl}
              onClick={setIsRunningHandler}
            ></PlayFill>
          ) : (
            <PauseFill
              data-testid="pause-btn"
              className={styles.timerControl}
              onClick={setIsRunningHandler}
            ></PauseFill>
          )}
          <ArrowCounterclockwise
            data-testid="reset-btn"
            className={styles.resetButton}
            onClick={resetTimer}
          ></ArrowCounterclockwise>
        </Fragment>
      )}
    </div>
  );
};

export default Clock;
