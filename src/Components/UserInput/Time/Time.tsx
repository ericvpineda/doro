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
  setErrorMessage: (err: string) => void;
}

const Time: FC<TimeFunctions> = (props): JSX.Element => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const setHoursHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const value = +event.target.value;
    props.setHours(value)

    if (value > 24) {
      props.setErrorMessage("Hours must be between 0-24.");
    } else if (value === 0 && minutes === 0) {
      props.setErrorMessage("Hours and minutes cannot both be 0.");
    } else {
      setHours(value);
      props.setHours(value);
      props.setErrorMessage("");
    }
  };

  const setMinutesHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const value = +event.target.value;
    props.setMinutes(value)
    
    if (value > 59) {
      props.setErrorMessage("Minutes must be between 0-59.");
    } else if (value === 0 && hours === 0) {
      props.setErrorMessage("Hours and minutes cannot both be 0.");
    } else {
      setMinutes(value);
      props.setMinutes(value);
      props.setErrorMessage("");
    }
  };

  const validateTime = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === "." || key === "-") {
      event.preventDefault();
    }
  };

  // Note: need to set dependecy for memoization
  const debouncedHoursHandler = useMemo(
    () => debounce(setHoursHandler, 300),
    [hours, minutes]
  );

  const debouncedMinutesHandler = useMemo(
    () => debounce(setMinutesHandler, 300),
    [hours, minutes]
  );

  useEffect(() => {
    const minutesElem = document.getElementById("minutes") as HTMLInputElement;
    const hoursElem = document.getElementById("hours") as HTMLInputElement;
    chrome.storage.local.get(["setTime"], (res) => {
      const hoursCache = res.setTime && res.setTime.hours;
      const minutesCache = res.setTime && res.setTime.minutes;
      if (hoursElem && hoursCache !== undefined && hoursCache > 0) {
        props.setHours(hoursCache);
        setHours(hoursCache)
        hoursElem.setAttribute("value", hoursCache);
      }
      if (minutesCache !== undefined && minutesCache > 0 && minutesElem) {
        props.setMinutes(minutesCache);
        setMinutes(minutesCache)
        minutesElem.setAttribute("value", minutesCache);
      }
      if (hoursCache === undefined && minutesCache === undefined) {
        props.setErrorMessage("Hours and minutes cannot both be 0.");
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
            onInput={debouncedHoursHandler}
            id="hours"
            className="form-control"
            type="number"
            min="0"
            max="24"
            placeholder="Set hours..."
            onKeyDown={validateTime}
          />
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
            onInput={debouncedMinutesHandler}
            id="minutes"
            className="form-control"
            type="number"
            min="0"
            max="59"
            placeholder="Set minutes..."
            onKeyDown={validateTime}
          />
        </div>
      </div>
    </Fragment>
  );
};

export default Time;
