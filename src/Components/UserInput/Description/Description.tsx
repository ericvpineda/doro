import React from "react";
import { FC, ChangeEvent, useEffect, useMemo } from "react";
import styles from "./Description.module.css";
import debounce from "lodash.debounce";
import { ChromeData } from "../../../Utils/ChromeUtils";

// Parent is UserInput component
interface Props {
  setDescription: (param: string) => void;
  setErrorMessage: (param: string) => void;
  defaultMsg: string;
}

// Description component for user input
const Description: FC<Props> = (props): JSX.Element => {
  const defaultMsg = props.defaultMsg;

  // Note: Invariant that description can never be empty
  const setDescriptHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const description = event.target.value;
    if (description && description.length > 30) {
      props.setErrorMessage("Focus plan character limit is 0-30.");
    } else {
      props.setErrorMessage("");
      props.setDescription(description.length > 0 ? description : defaultMsg);
    }
  };

  // Used to limit description input call rate
  const debounceChangeHandler = useMemo(
    () => debounce(setDescriptHandler, 300),
    []
  );


  // Get and set cache of user description
  useEffect(() => {
    const descriptionElem = document.getElementById("description");
    chrome.storage.local.get([ChromeData.description], (res) => {
      const descriptionCache = res.description;
      // Set cache description if element rendered and cache data valid
      if (descriptionElem && descriptionCache) {
        descriptionElem.innerHTML = descriptionCache;
        props.setDescription(descriptionCache);
      }
    });
  }, []);

  return (
    <div className="row text-nowrap">
      <div className="col-3">
        <label className="form-label" htmlFor="description">Focus plan?</label>
      </div>
      <div className="offset-1 col">
        <textarea
          onInput={debounceChangeHandler}
          className={styles.textArea + " form-control"}
          id="description"
          cols={20}
          rows={1}
          placeholder="Working..."/>
      </div>
    </div>
  );
};

export default Description;
