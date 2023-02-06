import React from "react";
import { FC, ChangeEvent, useState } from "react";
import styles from './Description.module.css'

interface DescriptFunction {
  setDescript: (param: string) => void;
}

const Description: FC<DescriptFunction> = (props): JSX.Element => {
  const [showError, setShowError] = useState(false);

  const setDescriptHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const description = event.target.value;
    if (description.length > 30) {
      setShowError(true);
    } else {
      props.setDescript(description);
      setShowError(false);
    }
  };

  return (
    <div className="row text-nowrap">
      <div className="col-3">
        <label className="form-label" htmlFor="description">
          Focus plan?
        </label>
      </div>
      <div className="offset-1 col">
        <textarea
          onBlur={setDescriptHandler}
          className={styles.textArea + " form-control text-nowrap overflow-hidden"}
          id="description"
          cols={20}
          rows={1}
          placeholder="Simply working..."
        ></textarea>
        {showError && (
          <div className="text-danger fs-6">
            Character limit 0 to 30.
          </div>
        )}
      </div>
    </div>
  );
};

export default Description;
