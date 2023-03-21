import React from "react";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { chrome } from "jest-chrome";
import { Status } from "../../../src/Utils/SpotifyUtils";
import Profile from "../../../src/Components/Login/Profile/Profile";

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

  it("getting user profile with user that has profile picture, returns success", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.SUCCESS, data: { profileUrl: "https://images.unsplash.com/photo-1457449940276-e8deed18bfff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" } });
    });
    mockFxn = jest.fn();
    const logSpy = jest.spyOn(console, "log");
    render(<Profile signOut={mockFxn}></Profile>);

    expect(logSpy).toBeCalledTimes(0);
  });
  
  it("getting user profile with user that has no profile picture, returns success", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.SUCCESS, data: { profileUrl: "" } });
    });
    mockFxn = jest.fn();
    const logSpy = jest.spyOn(console, "log");
    render(<Profile signOut={mockFxn}></Profile>);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("getting user profile, returns failure", () => {
    const message = "Failure when getting user profile."
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        data: { profileUrl: "" },
        error: {message}
      });
    });
    mockFxn = jest.fn();
    const logSpy = jest.spyOn(console, "log");
    render(<Profile signOut={mockFxn}></Profile>);

    expect(logSpy).toHaveBeenCalledWith(message);
  });

  it("getting user profile, returns error", () => {
    const message = "Error occured when getting user profile.";
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
        callback({
          status: Status.ERROR,
          data: { profileUrl: "" },
          error: {message}
        });
      });
      mockFxn = jest.fn();
      const logSpy = jest.spyOn(console, "log");
      render(<Profile signOut={mockFxn}></Profile>);
  
      expect(logSpy).toHaveBeenCalledWith(message);
  });

  it("getting user profile, returns unknown error", () => {
    const message = "Unknown error occured when getting profile url.";
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
        callback({
          status: Status.ERROR,
          data: { profileUrl: "" },
          error: {message}
        });
      });
      mockFxn = jest.fn();
      const logSpy = jest.spyOn(console, "log");
      render(<Profile signOut={mockFxn}></Profile>);
  
      expect(logSpy).toHaveBeenCalledWith(message);
  });

  it("user successfully gets profile, signs user out successfully", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.SUCCESS, data: { profileUrl: "" } });
    });
    mockFxn = jest.fn();
    render(<Profile signOut={mockFxn}></Profile>);

    const blankProfilePic = screen.getByTestId("profile-pic-blank");
    await user.click(blankProfilePic)
    
    const signOutBtn = screen.getByText("Sign out");
    await user.click(signOutBtn)

    expect(mockFxn).toBeCalledTimes(1);
  });
});
