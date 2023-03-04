import React, { FC, useState, useContext } from "react";
import DescriptContext from "../../../hooks/DescriptContext";
import Description from "../Description/Description";
import Time from "../Time/Time";
import styles from "./UserInput.module.css";
import { ArrowReturnRight } from "react-bootstrap-icons";

// Parenet is App component
interface pageUpdate {
  setShowTimerHandler: (param: boolean) => void;
}

// User Input Component
const UserInput: FC<pageUpdate> = (props): JSX.Element => {
  const [showError, setShowError] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [timeErrorMessage, setTimeErrorMessage] = useState("");
  const [descriptionErrorMessage, setDescriptionErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const ctx = useContext(DescriptContext);
  // TODO-LATER: Allow user to update default message
  const defaultMsg = "Working...";
  const [description, setDescription] = useState(defaultMsg);

  // Handlers when user submits input time and description
  const onSubmitHandler = () => {
    if (timeErrorMessage.length > 0) {
      setErrorMessage(timeErrorMessage);
      setShowError(true);
    } else if (descriptionErrorMessage.length > 0) {
      setErrorMessage(descriptionErrorMessage);
      setShowError(true);
    } else {
      // Set time and description if success
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
        isExecutingRequest: true,
        showPlayer: false,
      });

      // Prevent error message from showing
      setShowError(false);

      // Change page to timer gui window
      props.setShowTimerHandler(true);

      // Set description boolean to true
      ctx.showDescription();
    }
  };

  // Show Timer component
  const showTimerHandler = () => {
    props.setShowTimerHandler(true);
  };

  // Handlers setting user descriptoin
  const setDescriptionHandler = (text: string) => {
    setDescription(text);
  };

  // Handlers setting error message from Time component
  const setTimeErrorMessageHandler = (text: string) => {
    setTimeErrorMessage(text);
  };

  // Handles setting error message from Description component
  const setDescriptionErrorMessageHandler = (text: string) => {
    setDescriptionErrorMessage(text);
  };

  // Sets hours from Time component
  const setHoursHandler = (value: number) => {
    setHours(value);
  };

  // Handlers setting minutes from Time component
  const setMinutesHandler = (value: number) => {
    setMinutes(value);
  };

  return (
    <div className={styles.body}>
      <div className={styles.inputContainer}>
        <h3 className="mb-3 text-center">Set Timer</h3>
        <div className="container">
          <Time
            hours={hours}
            minutes={minutes}
            setHours={setHoursHandler}
            setMinutes={setMinutesHandler}
            setErrorMessage={setTimeErrorMessageHandler}
          />
          <Description
            defaultMsg={defaultMsg}
            setDescription={setDescriptionHandler}
            setErrorMessage={setDescriptionErrorMessageHandler}
          />
        </div>
        <button onClick={onSubmitHandler} className="btn btn-success mt-3">
          Start
        </button>
        {showError && <div className="text-danger fs-6">{errorMessage}</div>}
      </div>
      <ArrowReturnRight
        onClick={showTimerHandler}
        className={styles.clockButton}
      />
    </div>
  );
};

export default UserInput;
