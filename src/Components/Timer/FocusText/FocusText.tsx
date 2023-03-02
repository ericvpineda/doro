import React, { FC, useState, Fragment, useContext, useEffect } from "react";
import styles from "./FocusText.module.css";
import DescriptContext from "../../../hooks/DescriptContext";

const FocusText: FC = () => {
  const [description, setDescription] = useState("");
  const ctx = useContext(DescriptContext); // Rerender when clear button submit (clock component)
  

  useEffect(() => {
    chrome.storage.local.get(["description", "isExecutingRequest"], (res) => {
      if (res.isExecutingRequest) {
        setDescription(res.description);
      } 
    });
  }, []);

  return (
    <Fragment>
      {!ctx.isShowing ? (
        <footer className={styles.focusBox}>Doro</footer>
      ) : (
        <footer className={styles.focusBox} data-testid="focus-text-active">
          Task: <span className={styles.description}>{description}</span>
        </footer>
      )}
    </Fragment>
  );
};

export default FocusText;
