import React, { createContext, useState } from "react";

const DescriptContext = createContext({
  showDescript: false,
  onSetDescript: () => {},
  onClearDescript: () => {},
});

export const DescriptContextProvider = (props: any) => {
  const [showDescript, setShowDescript] = useState(false);

  const onSetDescript = () => {
    setShowDescript(false);
  };

  const onClearDescript = () => {
    setShowDescript(true);
  };

  return (
    <DescriptContext.Provider
      value={{
        showDescript,
        onSetDescript,
        onClearDescript,
      }}
    >
      {props.children}
    </DescriptContext.Provider>
  );
};

export default DescriptContext;
