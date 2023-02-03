import React, { KeyboardEvent } from "react";
import { FC, ChangeEvent, Fragment, useState } from "react";

interface TimeFunctions {
  setHours: (param: number) => void;
  setMinutes: (param: number) => void;
}

const Time: FC<TimeFunctions> = (props): JSX.Element => {

  const [showHourError, setShowHourError] = useState(false)
  const [showMinuteError, setShowMinuteError] = useState(false)

  const setHoursHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const hours = +event.target.value;
    if (hours > 24) {
        setShowHourError(true)
    } else {
        props.setHours(hours)
        setShowHourError(false)
    }
  };

  const setMinutesHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const minutes = +event.target.value;
    if (minutes > 59) {
        setShowMinuteError(true)
    } else {
        props.setMinutes(minutes)
        setShowMinuteError(false)
    }
  };

  const validateTime = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === '.' || key === '-') {
        event.preventDefault()
    }
  }

  return (
    <Fragment>
      <div className="row">
        <div className="col-3">
          <label className="form-label" htmlFor="hours">
            Hours
          </label>
        </div>
        <div className="offset-1 col">
          <input
            onChange={setHoursHandler}
            id="hours"
            className="form-control"
            type="number"
            min="0"
            max="24"
            placeholder="Set hours..."
            onKeyDown={validateTime}
          />
          {showHourError && <div className="text-danger fs-6">Must be between 0 to 24.</div>}
        </div>
      </div>

      <div className="row">
        <div className="col-3">
          <label className="form-label" htmlFor="minutes">
            Minutes
          </label>
        </div>
        <div className="offset-1 col">
          <input
            onChange={setMinutesHandler}
            id="minutes"
            className="form-control"
            type="number"
            min="0"
            max="59"
            placeholder="Set minutes..."
            onKeyDown={validateTime}
          />
          {showMinuteError && <div className="text-danger fs-6">Must be between 0 to 59.</div>}
        </div>
      </div>
    </Fragment>
  );
};

export default Time;
