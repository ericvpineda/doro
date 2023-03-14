import React from "react";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { chrome } from "jest-chrome";
import { Status } from "../../../Utils/SpotifyUtils";
import Profile from "../../../Components/Login/Profile/Profile";

// Test Points
// - get user profile (success, failure, error)

describe("Test Profile Component", () => {
  let user;
  beforeEach(() => {
    // Create userEvent object
    user = userEvent.setup();

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

  it("getting user profile returns success", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.SUCCESS, data: { profileUrl: "" } });
    });
    mockFxn = jest.fn();
    const logSpy = jest.spyOn(console, "log");
    render(<Profile signOut={mockFxn}></Profile>);

    expect(logSpy).toBeCalledTimes(0);
  });
  it("getting user profile returns failure", () => {
    const message = "Failure when getting user profile."
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        data: { profileUrl: "" },
        message,
      });
    });
    mockFxn = jest.fn();
    const logSpy = jest.spyOn(console, "log");
    render(<Profile signOut={mockFxn}></Profile>);

    expect(logSpy).toHaveBeenCalledWith(message);
  });

  it("getting user profile returns error", () => {
    const message = "Error occured when getting user profile.";
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
        callback({
          status: Status.ERROR,
          data: { profileUrl: "" },
          message,
        });
      });
      mockFxn = jest.fn();
      const logSpy = jest.spyOn(console, "log");
      render(<Profile signOut={mockFxn}></Profile>);
  
      expect(logSpy).toHaveBeenCalledWith(message);
  });
  it("getting user profile returns unknown error", () => {
    const message = "Unknown error occured when getting profile url.";
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
        callback({
          status: Status.ERROR,
          data: { profileUrl: "" },
          message,
        });
      });
      mockFxn = jest.fn();
      const logSpy = jest.spyOn(console, "log");
      render(<Profile signOut={mockFxn}></Profile>);
  
      expect(logSpy).toHaveBeenCalledWith(message);
  });
});
