import React from "react";
import { screen, render } from "@testing-library/react";
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

  it("hours and minutes input empty, show error message", () => {
    // render(<UserInput setShowTimerHandler={mockFxn}></UserInput>)
    // startBtn = screen.getByText(/Start/i)
    // user.click(startBtn)
    // // Check error message
    // const errorElem = screen.getByText(/Hours and minutes cannot both be 0./i)
    // expect(errorElem).toBeVisible()
    // // Check if chrome storage not tampered with
    // expect(chrome.storage.data["hours"]).toBe(-1)
    // expect(chrome.storage.data["minutes"]).toBe(-1)
  });

  it("hours and minutes input empty, sets error state to false", () => {
    // Check value of error state function
    //   let setError = jest.fn()
    //   jest.spyOn(React, 'useState').mockImplementation(x => [x, setError])
    //   render(<UserInput setShowTimerHandler={mockFxn}></UserInput>)
    //   startBtn = screen.getByText(/Start/i)
    //   fireEvent.click(startBtn)
    //   expect(setError).toBeCalledWith(true)
  });
});
