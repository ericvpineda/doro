import React from "react";
import { FC, useState, Fragment, useContext } from "react";
import Description from "../Description/Description";
import Time from "../Time/Time";
import styles from "./UserInput.module.css";
import { ArrowReturnRight } from "react-bootstrap-icons";
import DescriptContext from "../../../hooks/DescriptContext";

interface pageUpdate {
  setShowTimerHandler: (param: boolean) => void;
}

const UserInput: FC<pageUpdate> = (props): JSX.Element => {
  const [showError, setShowError] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const defaultMsg = "Working...";
  const [description, setDescription] = useState(defaultMsg);
  // TODO: Allow user to update default message
  const ctx = useContext(DescriptContext);

  const onSubmitHandler = () => {
    // TODO: Check for errors, if so, show error messgae
    if ((hours + minutes === 0) || description === "") {
      setShowError(true);
    } else {
      chrome.storage.local.set({
        hours,
        minutes,
        seconds: 0,
        description: description,
        isRunning: true,
        setTime: {
          hours,
          minutes,
        },
        isCleared: false,
        showPlayer: false,
      });

      // Prevent error message from showing
      setShowError(false);

      // Change page to timer gui window
      props.setShowTimerHandler(true);

      // Set description booleanto true
      ctx.onSetDescript();
    }
  };

  const showTimerHandler = () => {
    props.setShowTimerHandler(true);
  };

  const setDescriptionHandler = (text: string) => {
    setDescription(text);
  };

  return (
    <div className={styles.body}>
      <div
        className={
          styles.inputContainer + " d-flex flex-column justify-content-center"
        }
      >
        <h3 className="mb-3 text-center">Set Timer</h3>
        <div className="container">
          <Time
            hours={hours}
            minutes={minutes}
            setHours={setHours}
            setMinutes={setMinutes}
          />
          <Description
            description={description}
            defaultMsg={defaultMsg}
            setDescription={setDescriptionHandler}
          />
        </div>
        <button onClick={onSubmitHandler} className="btn btn-success mt-3">
          Start
        </button>
        {showError && (
          <div className="text-danger fs-6">Please fix errors.</div>
        )}
      </div>
      <ArrowReturnRight
        onClick={showTimerHandler}
        className={styles.clockButton}
      ></ArrowReturnRight>
    </div>
  );
};

export default UserInput;
