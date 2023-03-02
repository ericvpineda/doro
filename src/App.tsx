import React, { FC, Fragment, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import { DescriptContextProvider } from "./hooks/DescriptContext";

const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);

  // Note: isShowing props used ONLY for testing
  return (
    <Fragment>
      <DescriptContextProvider isShowing={false}>
        {!showTimer ?
          (<UserInput setShowTimerHandler={setShowTimer}></UserInput>) :
          (<Timer setShowTimerHandler={setShowTimer}/>)}
      </DescriptContextProvider>
    </Fragment>
  );
};

export default App;
