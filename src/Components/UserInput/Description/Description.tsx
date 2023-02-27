import React from "react";
import { FC, ChangeEvent, useState, useEffect, useMemo } from "react";
import styles from "./Description.module.css";
import debounce from "lodash.debounce";

interface DescriptFunction {
  setDescription: (param: string) => void;
  description: string;
  defaultMsg: string;
}

const Description: FC<DescriptFunction> = (props): JSX.Element => {
  const [showError, setShowError] = useState(false);
  const defaultMsg = props.defaultMsg;

  // Note: Invariant that description can never be empty
  const setDescriptHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const description = event.target.value;
    if (description.length > 30) {
      setShowError(true);
      props.setDescription(""); // Empty string is error
    } else {
      setShowError(false);
      props.setDescription(description.length > 0 ? description : defaultMsg);
    }
  };

  const debounceChangeHandler = useMemo(() => debounce(setDescriptHandler, 300), []);

  useEffect(() => {
    const descriptionElem = document.getElementById("description");
    chrome.storage.local.get(["description"], (res) => {
      const descriptionCache = res.description;
      if (
        descriptionElem &&
        descriptionCache !== undefined &&
        descriptionCache.length > 0 &&
        descriptionCache !== defaultMsg
      ) {
        descriptionElem.innerHTML = descriptionCache;
        props.setDescription(descriptionCache);
      }
    });
  }, []);

  return (
    <div className="row text-nowrap">
      <div className="col-3">
        <label className="form-label" htmlFor="description">
          Focus plan?
        </label>
      </div>
      <div className="offset-1 col">
        <textarea
          onChange={debounceChangeHandler}
          className={
            styles.textArea + " form-control text-nowrap overflow-hidden"
          }
          id="description"
          cols={20}
          rows={1}
          placeholder="Working..."
        ></textarea>
        {showError && (
          <div className="text-danger fs-6">Character limit 0 to 30.</div>
        )}
      </div>
    </div>
  );
};

export default Description;
