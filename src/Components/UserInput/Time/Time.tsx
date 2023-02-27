import React, {
  KeyboardEvent,
  FC,
  ChangeEvent,
  Fragment,
  useState,
  useEffect,
  useMemo,
} from "react";
import debounce from "lodash.debounce";

interface TimeFunctions {
  setHours: (param: number) => void;
  setMinutes: (param: number) => void;
  hours: number;
  minutes: number;
}

const Time: FC<TimeFunctions> = (props): JSX.Element => {
  const [showHourError, setShowHourError] = useState(false);
  const [showMinuteError, setShowMinuteError] = useState(false);

  const setHoursHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const hours = +event.target.value;
    if (hours > 24) {
      setShowHourError(true);
    } else {
      props.setHours(hours);
      setShowHourError(false);
    }
  };

  const setMinutesHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const minutes = +event.target.value;
    if (minutes > 59) {
      setShowMinuteError(true);
    } else {
      props.setMinutes(minutes);
      setShowMinuteError(false);
    }
  };

  const validateTime = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === "." || key === "-") {
      event.preventDefault();
    }
  };

  const debouncedHoursHandler = useMemo(() => debounce(setHoursHandler, 300), []);

  const debouncedMinutesHandler = useMemo(() => debounce(setMinutesHandler, 300), []);

  useEffect(() => {
    const minutesElem = document.getElementById("minutes") as HTMLInputElement;
    const hoursElem = document.getElementById("hours") as HTMLInputElement;
    chrome.storage.local.get(["setTime"], (res) => {
      const minutesCache = res.setTime && res.setTime.minutes;
      if (minutesCache !== undefined && minutesCache > 0 && minutesElem) {
        minutesElem.setAttribute("value", res.setTime.minutes);
        props.setMinutes(res.setTime.minutes);
      }
      const hoursCache = res.setTime && res.setTime.hours;
      if (hoursCache !== undefined && hoursCache > 0 && hoursElem) {
        hoursElem.setAttribute("value", res.setTime.hours);
        props.setHours(res.setTime.hours);
      }
    });
  }, []);

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
            onChange={debouncedHoursHandler}
            id="hours"
            className="form-control"
            type="number"
            min="0"
            max="24"
            placeholder="Set hours..."
            onKeyDown={validateTime}
          />
          {showHourError && (
            <div className="text-danger fs-6">Must be between 0-24.</div>
          )}
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
            onChange={debouncedMinutesHandler}
            id="minutes"
            className="form-control"
            type="number"
            min="0"
            max="59"
            placeholder="Set minutes..."
            onKeyDown={validateTime}
          />
          {showMinuteError && (
            <div className="text-danger fs-6">Must be between 0-59.</div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Time;
