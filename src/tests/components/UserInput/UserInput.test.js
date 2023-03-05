import React from "react";
import { screen, render, waitFor } from "@testing-library/react";
import { chrome } from "jest-chrome";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import UserInput from "../../../Components/UserInput/UserInput/UserInput.tsx";

// Areas of test
// - valid hours and minutes and start button pushed
// - invalid hours and minutes shows error message
// - invalid description shows error message

describe("Test UserInput component", () => {
  let startBtn, user, mockFxn;
  beforeEach(() => {
    user = userEvent.setup();
    mockFxn = jest.fn();

    // Stub chrome api
    global.chrome.storage.data = {};
    global.chrome.storage.local.set = (inputs) => {
      for (const [key, value] of Object.entries(inputs)) {
        chrome.storage.data[key] = value;
      }
    };
    global.chrome.storage.local["get"] = (keys, callback) => {
      const map = {};
      for (let key of keys) {
        map[key] = chrome.storage.data[key];
      }
      return callback(map);
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("user inputs 0 hours and minutes, show error message", async () => {
    render(<UserInput setShowTimerHandler={mockFxn}></UserInput>);
    const inputMinutes = screen.getByLabelText("Minutes");
    const inputHours = screen.getByLabelText("Hours");
    const message = "0";
    user.type(inputHours, message);
    user.type(inputMinutes, message);
    startBtn = screen.getByText(/Start/i);
    await user.click(startBtn);

    // // Check error message
    const errorElem = screen.getByText(/Hours and minutes cannot both be 0./i);
    expect(errorElem).toBeVisible();
  });

  it("user inputs too long description, shows error message", async () => {
    render(<UserInput setShowTimerHandler={mockFxn}></UserInput>);

    // Set time to valid value
    const inputHours = screen.getByLabelText("Hours");
    const message = "1";
    user.type(inputHours, message);
    await waitFor(() => expect(inputHours).toHaveValue(+message));

    // Set description to invalid value
    const inputDescription = screen.getByRole("textbox");
    const description = "This message is way too long...";
    user.type(inputDescription, description);
    await waitFor(() => {
      expect(inputDescription).toHaveValue(description);
      // Click start button
      startBtn = screen.getByText(/Start/i);
      user.click(startBtn);
      const errorElem = screen.getByText(/Focus plan character limit is 0-30./i);
      expect(errorElem).toBeVisible();
    });
  });

  it("user input valid hours and description, submission success", async () => {
    render(<UserInput setShowTimerHandler={mockFxn}></UserInput>);

    // Set time to valid value
    const inputHours = screen.getByLabelText("Hours");
    const message = "1";
    user.type(inputHours, message);
    await waitFor(() => expect(inputHours).toHaveValue(+message));

    // Set description to invalid value
    const inputDescription = screen.getByRole("textbox");
    const description = "This message is valid!";
    user.type(inputDescription, description);
    await waitFor(() => {
      expect(inputDescription).toHaveValue(description);
      // Click start button
      startBtn = screen.getByText(/Start/i);
      user.click(startBtn);
      expect(mockFxn).toHaveBeenCalledWith(true);
    });
  })

  it("user clicks return to clock button and is successful", async () => {
    render(<UserInput setShowTimerHandler={mockFxn}></UserInput>);
    const returnButton = screen.getByTestId("return-button");
    await user.click(returnButton);

    expect(mockFxn).toHaveBeenCalledWith(true);
  })

  // Check value of error state function
  // it("hours and minutes input empty, sets error state to false", () => {
    //   let setError = jest.fn()
    //   jest.spyOn(React, 'useState').mockImplementation(x => [x, setError])
    //   render(<UserInput setShowTimerHandler={mockFxn}></UserInput>)
    //   startBtn = screen.getByText(/Start/i)
    //   fireEvent.click(startBtn)
    //   expect(setError).toBeCalledWith(true)
  // });
});
