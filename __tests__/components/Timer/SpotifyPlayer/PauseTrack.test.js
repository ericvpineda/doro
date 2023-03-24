import React from "react";
import {
  render,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../../src/Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { Status } from "../../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

describe("Test SpotifyPlayer component pause track", () => {
  let user, logSpy;
  beforeEach(() => {
    user = userEvent.setup();
    logSpy = jest.spyOn(console, "log");
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
    jest.clearAllMocks(); // Clears spy mocks
    // global.chrome.runtime.sendMessage = jest.fn();
    document.body.innerHTML = "";
  });

  // ----- PAUSE TRACK TESTS -----

  it("player is playing and user PAUSES track, returns success", async () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage.mockImplementation(
      (obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test7",
            isPlaying: true,
          },
        });
      }
    )

    render(<SpotifyPlayer />);

    // User presses pause button
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("player is playing and user PAUSES track, returns error", async () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test8",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce((obj, callback) => {
        // Mock pause track request
        callback({
          status: Status.ERROR,
          error: {
            message: "Error when completing track command.",
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test8",
            isPlaying: false,
          },
        });
      })

    render(<SpotifyPlayer />);

    // User pauses current track
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
  });

  it("player is playing and non-premium user PAUSES track, spotify window not found, does nothing", async () => {

    // Mock initial request get current track
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test9",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce(
        // Mock pause track request
        (obj, callback) =>
          callback({
            status: Status.FAILURE,
          })
      ).mockImplementation((obj, callback) => { // Mock subsequent get track request
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test9",
            isPlaying: false,
          },
        });
      })

    // Mock getting spotify tab in chrome browser
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "", id: 1 }]);
    };

    render(<SpotifyPlayer />);

    // User pasuses current track
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);
    // await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("player is playing and non-premium user PAUSES track, returns success", async () => {
    // Mock document to have track button
    document.body.innerHTML = `<div>
    <button data-testid="control-button-playpause"></button>
  </div>`;

    // Mock initial get track request
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test10",
            track: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce( // Mock pause track request
        (
          obj,
          callback
        ) => callback({ status: Status.FAILURE })
      ).mockImplementation((obj, callback) => { // Mock subsequent get track requests
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test10.1",
            track: "",
            isPlaying: false,
          },
        });
      })

    // Mock getting spotify tab in chrome browser
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://open.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: ({ target, func }) => {
        return new Promise((resolve, reject) => resolve([{result: func()}]));
      },
    };

    render(<SpotifyPlayer />);

    // User clicks pause button
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    // Note: Need to wait since injection function waits for chrome storage call
    expect(logSpy).toBeCalledTimes(0);
  });

  // Returns failure since necessary spotify DOM elements not loaded
  it("player is playing and non-premium user PAUSES track, returns failure", async () => {

    // Mock initial get track request
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test11",
            track: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce(
        (
          obj,
          callback // Mock pause track request
        ) => callback({ status: Status.FAILURE  })
      ).mockImplementation((obj, callback) => { // Mock subsequent get track requests
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test10.1",
            track: "",
            isPlaying: false,
          },
        });
      })

    // Mock getting spotify tab in chrome browser
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://open.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: ({ target, func }) => {
        return new Promise((resolve, reject) => resolve([{result: func()}]));
      },
    };

    render(<SpotifyPlayer />);

    // User clicks pause button
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when pausing track.");
  });

  it("player is playing and non-premium user PAUSES track, injection script returns failure", async () => {

    // Mock initial get track request
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test12",
            track: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce((obj, callback) => // Mock pause request
        callback({ status: Status.FAILURE })
      ).mockImplementation((obj, callback) => { // Mock subsequent get track requests
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test12.1",
            track: "",
            isPlaying: false,
          },
        });
      })

    // Mock getting spotify tab in chrome browser
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://open.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: ({ target, func }) => {
        return new Promise((resolve, reject) => reject(func()));
      },
    };

    render(<SpotifyPlayer />);

    // User clicks pause button
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when pausing track.");
  });

  it("player is playing and user PAUSES track, returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce((obj, callback) => {
        callback({ status: Status.TESTING });
      }).mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: false,
          },
        });
      })

    render(<SpotifyPlayer />);
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    // Note: Need to wait since injection function waits for chrome storage call
    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when pausing track."
      );
  });
});