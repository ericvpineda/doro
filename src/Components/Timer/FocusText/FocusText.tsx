import React, { FC, useState, Fragment, useContext, useEffect } from "react";
import styles from "./FocusText.module.css";
import DescriptContext from "../../../hooks/DescriptContext";
import {ChromeData} from "../../../Utils/ChromeUtils";

const FocusText: FC = () => {
  const [description, setDescription] = useState("");
  const [isExecutingRequest, setIsExecutingRequest] = useState(false);
  const ctx = useContext(DescriptContext); // Rerender when clear button submit (clock component)

  useEffect(() => {
    chrome.storage.local.get(
      [ChromeData.description, ChromeData.isExecutingRequest],
      (res) => {
        if (res.isExecutingRequest === true) {
          setDescription(res.description);
          setIsExecutingRequest(true);
        } else {
          setDescription("");
          setIsExecutingRequest(false);
        }
      }
    );
  }, [ctx.isShowing, description, isExecutingRequest]);

  return (
    <Fragment>
      {isExecutingRequest || ctx.isShowing ? (
        <footer className={styles.focusBox} data-testid="focus-text-active">
          Task: <span className={styles.description}>{description}</span>
        </footer>
      ) : (
        <footer className={styles.focusBox}>Doro</footer>
      )}
    </Fragment>
  );
};

export default FocusText;
