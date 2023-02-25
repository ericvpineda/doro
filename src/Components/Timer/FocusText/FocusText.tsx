import React, { FC, useState, Fragment, useContext, useEffect } from "react";
import styles from "./FocusText.module.css";
import DescriptContext from "../../../hooks/DescriptContext";
// const {fonts, renderPixels} = require('js-pixel-fonts')

const FocusText: FC = () => {
  const [description, setDescription] = useState("");
  const ctx = useContext(DescriptContext);
  

  useEffect(() => {
    // Note: Will be rerendered by App.tsx when change window
    chrome.storage.local.get(["description", "isCleared"], (res) => {
      if (!res.isCleared) {
        setDescription(res.description);
      } else {
        ctx.onClearDescript();
      }
    });
  }, []);

  return (
    <Fragment>
      {ctx.showDescript ? (
        <footer className={styles.focusBox}>Doro</footer>
      ) : (
        <footer className={styles.focusBox}>
          Task: <span className={styles.description}>{description}</span>
        </footer>
      )}
    </Fragment>
  );
};

export default FocusText;
