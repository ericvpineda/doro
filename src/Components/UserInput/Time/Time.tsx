import React, { KeyboardEvent } from "react";
import { FC, ChangeEvent, Fragment, useState } from "react";

interface TimeFunctions {
  setHours: (param: number) => void;
  setMinutes: (param: number) => void;
}

const Time: FC<TimeFunctions> = (props): JSX.Element => {

  const [showError, setShowError] = useState(false)

  const setHoursHandler = (event: ChangeEvent<HTMLInputElement>) => {
    props.setHours(+event.target.value)
  };

  const validateTime = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === '.' || key === '-') {
        event.preventDefault()
    }
  }

  const setMinutesHandler = (event: ChangeEvent<HTMLInputElement>) => {
    props.setMinutes(+event.target.value);
  };

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
          {showError && <div className="text-danger fs-6">Must be integer between 0 and 24.</div>}
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
          />
        </div>
      </div>
    </Fragment>
  );
};

export default Time;
