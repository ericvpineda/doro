import React, { createContext, useState, useEffect } from "react";
import { ChromeData } from "../Utils/ChromeUtils";

// Description context 
// - Used to create manual state update in FocuxText component
const DescriptContext = createContext({
  isShowing: false,
  showDescription: () => {},
  hideDescription: () => {},
});

// Provier wrapper that houses context state
export const DescriptContextProvider = (props: any) => {
  const [isShowing, setIsShowing] = useState(false);
  
  const showDescription = () => {
    chrome.storage.local.set({isShowing: true})
    setIsShowing(true);
  };
  
  const hideDescription = () => {
    chrome.storage.local.set({isShowing: false})
    setIsShowing(false);
  };

  useEffect(() => {
    chrome.storage.local.get([ChromeData.isShowing], (res) => {
      if (res.isShowing === true) {
        setIsShowing(true)
      }
    })
  }, [])
  
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