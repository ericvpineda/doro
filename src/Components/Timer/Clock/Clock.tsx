import React, { FC, useEffect, useState, Fragment } from "react";
import styles from "./Clock.module.css";
import { XCircleFill, ArrowCounterclockwise } from "react-bootstrap-icons";

const Clock: FC = () => {
  const [timer, setTimer] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [controlText, setControlText] = useState("Start");
  const [isCleared, setIsCleared] = useState(true);

  // Helper function to update clock time and effects
  const progressRing = document.getElementById("timer-outer")! as HTMLElement;
  const updateTime = () => {
    chrome.storage.local.get(
      ["hours", "minutes", "seconds", "setTime", "isCleared"],
      (res) => {
        if (
          res.seconds !== undefined &&
          (res.hours !== 0 || res.minutes !== 0 || res.seconds !== -1)
        ) {
          // Update clock time ui
          const hours: string =
            res.hours >= 10 ? res.hours.toString() : "0" + res.hours;
          const minutes: string =
            res.minutes >= 10 ? res.minutes.toString() : "0" + res.minutes;
          const seconds: string =
            res.seconds >= 10 ? res.seconds.toString() : "0" + res.seconds;
          setTimer({ hours, minutes, seconds });

          // Update clock gui
          let degree = 0;
          if (res.isCleared === false) {
            const curr_time: number =
              res.hours * 3600 + res.minutes * 60 + res.seconds;
            const end_time: number =
              res.setTime.hours * 3600 + res.setTime.minutes * 60;
            degree = 360 - (curr_time / end_time) * 360;
          }
          if (progressRing) {
            progressRing.style.background = `conic-gradient(
                          lightgreen ${degree}deg,
                          #212529 ${degree}deg 
                      )`;
          }
        }
      }
    );
  };

  // Update start / pause button on clock gui
  const setControlTextHandler = () => {
    chrome.storage.local.get(
      ["isRunning", "hours", "minutes", "seconds"],
      (res) => {
        // FIX: Improve way to check start and stop button
        if (
          res.seconds !== undefined &&
          (res.hours !== 0 || res.minutes !== 0 || res.seconds !== 0)
        ) {
          chrome.storage.local.set({ isRunning: !res.isRunning });
          setControlText(res.isRunning ? "Start" : "Pause");
        }
      }
    );
  };

  const clearTimer = () => {
    chrome.storage.local.set({
      isRunning: false,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isCleared: true,
    });
    setControlText("Start");
    setIsCleared(true);
  };

  const resetTimer = () => {
    chrome.storage.local.get(["setTime"], (res) => {
        const origTime = res.setTime;
        chrome.storage.local.set({
            hours: origTime.hours,
            minutes: origTime.minutes,
            seconds: 0
        })
    })
    updateTime()
    
  }

  // Initial re-render (allow initial set timer to show up)
  useEffect(() => {
    chrome.storage.local.get(["isRunning", "seconds", "isCleared"], (res) => {
      if (res.seconds !== undefined) {
        setControlText(res.isRunning ? "Pause" : "Start");
        setIsCleared(res.isCleared);
      }
    });
    updateTime();
  }, []);

  // Note: Assumed that isRunning is true
  useEffect(() => {
    chrome.storage.onChanged.addListener(() => {
      updateTime();
    });
  }, [isCleared]);

  {
    /* <!-- FIX: Change out with picture later  --> */
  }
  return (
    <div id="timer-outer" className={styles.timerOuter}>
      <div className={styles.timerRing} onClick={() => setControlTextHandler()}>
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
        <div className={styles.timerControl} id="timer-control">
          {controlText}
        </div>
      </div>
      {!isCleared && (
        <Fragment>
          <XCircleFill
            className={styles.clearButton}
            onClick={clearTimer}
          ></XCircleFill>
          <ArrowCounterclockwise
            className={styles.resetButton}
            onClick={resetTimer}
          ></ArrowCounterclockwise>
        </Fragment>
      )}
    </div>
  );
};

export default Clock;
