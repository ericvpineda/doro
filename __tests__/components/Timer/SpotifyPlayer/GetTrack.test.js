import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../../src/Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { Status } from "../../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

describe("Test SpotifyPlayer component get track", () => {
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
  // ----- GET TRACK TESTS -----

  it("player GETS track successfully", () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "Test1: This artist has a name larger than 30 characters",
        },
      });
    });

    render(<SpotifyPlayer />);
    expect(logSpy).toBeCalledTimes(0);
  });

  it("player GETS advertisement track successfully", () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "Test2",
          type: "ad",
          isPlaying: false,
        },
      });
    });

    render(<SpotifyPlayer />);
    expect(logSpy).toBeCalledTimes(0);
  });

  it("player GETS track, then gets advertisement, returns success", async () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            isPlaying: false,
            artist: "Test3",
          },
        });
      })
      .mockImplementation((obj, callback) => {
        // Mock next track request
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test3.1",
            isPlaying: false,
            type: "ad",
          },
        });
      });

    render(<SpotifyPlayer />);

    // User presses next track button
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("player GETS track and returns failure", () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        error: {
          message: "Web player not open in browser.",
        },
      });
    });

    render(<SpotifyPlayer />);

    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("Web player not open in browser.");
  });

  it("players GETS track and returns error", () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.ERROR,
        error: { message: "Error occured when getting track data." },
      });
    });

    render(<SpotifyPlayer />);

    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      "Error occured when getting track data."
    );
  });

  it("players GETS track and returns unknown error", () => {
    // Mock initial request get current track
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      if (typeof callback === "function") {
        callback({ status: Status.TESTING });
      }
    });

    render(<SpotifyPlayer />);

    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when getting track data."
    );
  });

  // ----- AlbumArt DEPENDANT TESTS -----

  // Note: PlayerStatus changes from SUCCESS -> AD_PLAYING
  it("player is currently playing, non-premium user clicks next button, then ad starts to play, shows ad prompt", async () => {
    // Mock document to have track button
    document.body.innerHTML = `<div>
  <button data-testid="control-button-skip-forward"></button>
</div>`;

    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 0,
            track: "",
            progress: 0,
            duration: 0,
            type: "track",
          },
        });
      })
      .mockImplementationOnce((obj, callback) =>
        callback({ status: Status.FAILURE })
      )
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 0,
            track: "",
            progress: 0,
            duration: 0,
            type: "ad",
          },
        });
      });

    // Mock getting spotify tab
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://www.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: ({ target, func }) => {
        return new Promise((resolve, reject) => resolve(func()));
      },
    };

    render(<SpotifyPlayer />);
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toBeCalledTimes(0);

    waitFor(() => {
      const adPrompt = screen.getByText("Ad is currently playing...");
      expect(adPrompt).toBeVisible();
    });
  });
});
