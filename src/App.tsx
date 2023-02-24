import React, { FC, Fragment, useState } from "react";
import UserInput from "./Components/UserInput/UserInput/UserInput";
import Timer from "./Components/Timer/Timer/Timer";
import { DescriptContextProvider } from "./hooks/DescriptContext";

const App: FC = () => {
  const [showTimer, setShowTimer] = useState(true);
  const [showDescript, setShowDescript] = useState(false);

  return (
    <Fragment>
      <DescriptContextProvider>
        {!showTimer ?
          (<UserInput setShowTimerHandler={setShowTimer}></UserInput>) :
          (<Timer setShowTimerHandler={setShowTimer}/>)}
      </DescriptContextProvider>
    </Fragment>
  );
};

export default App;
