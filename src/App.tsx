import React, { FC, Fragment, useEffect, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import styles from "./App.module.css";
import { GearFill, ArrowLeftCircle } from "react-bootstrap-icons";

const App: FC = () => {
  const [showTimer, setShowTimer] = useState(false);

  // Set current window
  const onClickHandler = () => {
    setShowTimer(!showTimer);
  };

  return (
    <Fragment>
      {!showTimer && <UserInput setShowTimerHandler={setShowTimer}></UserInput>}
      {showTimer && <Timer />}
      {/* FIX: Update edit button  */}
      {showTimer ? (
        <GearFill
          onClick={onClickHandler}
          className={styles.toEditButton}
        ></GearFill>
      ) : (
        <ArrowLeftCircle
          onClick={onClickHandler}
          className={styles.toClockButton}
        ></ArrowLeftCircle>
      )}
    </Fragment>
  );
};

export default App;
