import React, { createContext, useState } from "react";

const DescriptContext = createContext({
  isShowing: false,
  showDescription: () => {},
  hideDescription: () => {},
});


export const DescriptContextProvider = (props: any) => {
  const [isShowing, setIsShowing] = useState(false);
  const showDescription = () => {
    setIsShowing(true);
  };
  
  const hideDescription = () => {
    setIsShowing(false);
  };
  
  return (
    <DescriptContext.Provider
    value={{
      isShowing,
      showDescription,
      hideDescription,
    }}
    >
      {props.children}
    </DescriptContext.Provider>
  );
};

export default DescriptContext;