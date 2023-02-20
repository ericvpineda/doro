import React, { FC, Fragment, useState, useEffect } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";

const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);

  return (
    <Fragment>
      {!showTimer ? 
        (<UserInput setShowTimerHandler={setShowTimer}></UserInput>) : 
        (<Timer setShowTimerHandler={setShowTimer}/>)}
    </Fragment>
  );
};

export default App;
