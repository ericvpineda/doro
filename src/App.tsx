import React, { FC, Fragment, useState, useEffect } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import Login from "./Components/Login/Login";


const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <Fragment>
      <Login setShowPlayer={setShowPlayer}></Login>
      {!showTimer ? 
        (<UserInput setShowTimerHandler={setShowTimer}></UserInput>) : 
        (<Timer showPlayer={showPlayer} setShowTimerHandler={setShowTimer}/>)}
    </Fragment>
  );
};

export default App;
