import React from "react";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "../../../src/Components/Login/Login/Login"
import { chrome } from "jest-chrome";
import { Status } from "../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

// Test points
// - user sign in (success, failure, error)
// - user sign out
// - TODO: Add tests for props.setShowPlayer prop 

describe("Test Login component", () => {
  let mockFxn;
  beforeEach(() => {
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

  it("user status signed out and successful sign in shows no errors", async () => {
    // Note: Login component will also render Profile and Spotify components
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.SUCCESS, data: { profileUrl: "" } });
    });
    mockFxn = jest.fn();
    render(<Login setSignedIn={mockFxn} setShowPlayer={mockFxn}></Login>);
    const spotifyButton = screen.getByTestId("spotify-button");
    expect(spotifyButton).toBeInTheDocument();

    await userEvent.click(spotifyButton);
    expect(mockFxn).toHaveBeenCalledWith(true);
  });

  it("user status signed out and unsuccessful sign in shows error in console", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.ERROR,
        data: { profileUrl: "" },
        error: {message: "User access denied."},
      });
    });
    mockFxn = jest.fn();

    render(<Login setSignedIn={mockFxn} setShowPlayer={mockFxn}></Login>);

    const spotifyButton = screen.getByTestId("spotify-button");
    expect(spotifyButton).toBeInTheDocument();

    const logSpy = jest.spyOn(console, "log");
    await userEvent.click(spotifyButton);
    expect(mockFxn).toHaveBeenCalledWith(false);

    expect(logSpy).toHaveBeenCalledWith("User access denied.");
  });

  it("user status logged in and user attempt to log in again", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        data: { profileUrl: "" },
        error: {message: "User already logged in."},
      });
    });
    mockFxn = jest.fn();
    render(<Login setSignedIn={mockFxn} setShowPlayer={mockFxn}></Login>);
    const spotifyButton = screen.getByTestId("spotify-button");
    expect(spotifyButton).toBeInTheDocument();

    const logSpy = jest.spyOn(console, "log");
    await userEvent.click(spotifyButton);

    // Note: cannot check parameters due to randomly created varaibles [WILL ERROR]
    // expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({message: PlayerActions.SIGNIN, data: {}})
    expect(logSpy).toHaveBeenCalledWith("User already logged in.");
  });

  it("user status signed in and user successfuly signs out", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.SUCCESS, data: { profileUrl: "" } });
    });
    chrome.storage.local.set({ signedIn: true });
    mockFxn = jest.fn();
    render(<Login setSignedIn={mockFxn} setShowPlayer={mockFxn}></Login>);

    // Check profile icon visible and spotify button invisible
    const spotifyButton = screen.queryByTestId("spotify-button");
    const profileIcon = screen.getByTestId("profile-icon");
    expect(spotifyButton).not.toBeInTheDocument();
    expect(profileIcon).toBeInTheDocument();

    // Click profile icon and click signout button
    await userEvent.click(profileIcon);
    const signOutButton = screen.getByText(/Sign out/i);
    expect(signOutButton).toBeInTheDocument();
    await userEvent.click(signOutButton);

    // Login props function is called with boolean
    expect(mockFxn).toHaveBeenCalledWith(false);
  });

  it("user status signed out and unknown error occurs", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({ status: Status.TESTING });
    });

    chrome.storage.local.set({ signedIn: true });

    mockFxn = jest.fn();
    render(<Login setSignedIn={mockFxn} setShowPlayer={mockFxn}></Login>);

    const profileIcon = screen.getByTestId("profile-icon");
    expect(profileIcon).toBeInTheDocument();

    // Click profile icon and click signout button
    await userEvent.click(profileIcon);

    const logSpy = jest.spyOn(console, "log");
    const signOutButton = screen.getByText(/Sign out/i);
    expect(signOutButton).toBeInTheDocument();
    await userEvent.click(signOutButton);
    expect(mockFxn).toHaveBeenCalledWith(false);

    expect(logSpy).toHaveBeenCalledWith("Unknown error when signing user out");
  });

  it("user status signed in and attempting to sign out causes error but still signs user out", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({data: { profileUrl: "" } });
    });
    chrome.storage.local.set({ signedIn: true });
    mockFxn = jest.fn();
    render(<Login setSignedIn={mockFxn} setShowPlayer={mockFxn}></Login>);
    
    // Click profile icon and click signout button
    const profileIcon = screen.getByTestId("profile-icon");
    await userEvent.click(profileIcon);
    const signOutButton = screen.getByText(/Sign out/i);
    expect(signOutButton).toBeInTheDocument();
    const logSpy = jest.spyOn(console, "log");
    await userEvent.click(signOutButton);

    // Login props function is called with boolean
    expect(mockFxn).toHaveBeenCalledWith(false);
    expect(logSpy).toHaveBeenCalledWith("Unknown error when signing user out");
  });
});
