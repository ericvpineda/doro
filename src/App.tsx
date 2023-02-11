import React, { FC, Fragment, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import Login from "./Components/Login/Login";


const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);
  const [accessToken, setAccessToken] = useState("");

  console.log("App.tsx=", accessToken);

  return (
    <Fragment>
      <Login setAccessTokenHandler={setAccessToken}></Login>
      {!showTimer ? 
        (<UserInput setShowTimerHandler={setShowTimer}></UserInput>) : 
        (<Timer accessToken={accessToken} setShowTimerHandler={setShowTimer}/>)}
    </Fragment>
  );
};

export default App;
