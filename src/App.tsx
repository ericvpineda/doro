import React, { FC, Fragment, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import styles from "./App.module.css";
import Login from "./Components/Login/Login";
import { GearFill, ArrowRightCircle } from "react-bootstrap-icons";


const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);
  const [accessToken, setAccessToken] = useState("");

  // Set current window
  const onClickHandler = () => {
    setShowTimer(!showTimer);
  };

  return (
    <Fragment>
      <Login setAccessTokenHandler={setAccessToken}></Login>
      {!showTimer ? ( 
        <>
          <UserInput setShowTimerHandler={setShowTimer}></UserInput>
          <ArrowRightCircle
            onClick={onClickHandler}
            className={styles.clockButton}
          ></ArrowRightCircle>
        </>
      ) : (
        <>
          <Timer />
          <GearFill
            onClick={onClickHandler}
            className={styles.editButton}
          ></GearFill>
        </>
      )}
    </Fragment>
  );
};

export default App;
