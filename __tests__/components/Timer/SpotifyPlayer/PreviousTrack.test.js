import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../../src/Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { Status } from "../../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";
import { PlayerActions } from "../../../../src/Utils/SpotifyUtils";

// Note:
// - Assertions dealing with chrome.sendMessage needs to be wrapped in waitFor
//  - Else, will have async errors

// Tests for SpotifyPlayer component
describe("Test SpotifyPlayer component previous track", () => {
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
    document.body.innerHTML = "";
  });

  // ----- PREVIOUS TRACK TESTS -----

  // Test #1
  it("player plays song at 0ms and user plays PREVIOUS track, returns success", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "",
          isPlaying: true,
          progressMs: 0,
          durationMs: 0,
        },
      });
    });
    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2);
      expect(logSpy).toBeCalledTimes(0);
    })
  });

  // Test #2
  it("player is playing song greater than 0ms and user plays PREVIOUS track, returns success", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "",
          isPlaying: true,
          type: "track",
          progressMs: 0,
          durationMs: 0,
        },
      });
    });
    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2);
      expect(logSpy).toBeCalledTimes(0);
    })
  });

  // Test #3
  // Note: Seek track back to 0ms
  it("player is playing and user plays PREVIOUS track, returns error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
            progressMs: 0,
            durationMs: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.ERROR,
          error: {
            message: "Error when completing track command.",
          },
        });
      });

    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2);
      expect(logSpy).toHaveBeenCalledWith(
        "Error when completing track command."
      );
    });
  });

  // Steps
  // - mock chrome tabs query with fake spotify url, tab id
  // - mock chrome scripting executeScript
  //  - mock document object for correct document objects
  //  - mock fulfilled state and rejected state
  // Test #4
  it("non-premium user plays PREVIOUS track, returns success", async () => {
    // Mock document to have track button
    document.body.innerHTML = `<div>
    <button data-testid="control-button-skip-back"></button>
  </div>`;

    // Mock initial call to get track information
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test4",
            track: "",
            isPlaying: true,
            progressMs: 0,
            durationMs: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE
        });
      })

    // Mock getting spotify tab in chrome browser
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
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2);
      expect(logSpy).toBeCalledTimes(0);
      expect(global.chrome.runtime.sendMessage).toBeCalledWith(
        { message: PlayerActions.GET_CURRENTLY_PLAYING },
        expect.any(Function)
      );
    });
  });

  // Test #5
  it("non-premium user plays PREVIOUS track, returns failure", async () => {

    // Mock initial call to get track information
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test5",
            track: "",
            isPlaying: true,
            progressMs: 0,
            durationMs: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
        });
      })

    // Mock getting spotify tab in chrome browser
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
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledWith(
        { message: PlayerActions.GET_CURRENTLY_PLAYING },
        expect.any(Function)
      );
      expect(logSpy).toHaveBeenCalledWith(
        "Failure when getting previous track."
      );
    });
  });

  // Test #6
  it("non-premium user plays PREVIOUS track, injection script returns failure", async () => {

    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "Test6",
            isPlaying: false,
            progressMs: 0,
            durationMs: 0,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
      )

    // Mock getting spotify tab
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://www.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: ({ target, func }) => {
        return new Promise((resolve, reject) => reject(func()));
      },
    };

    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(
      () => {
        expect(logSpy).toHaveBeenCalledWith(
          "Failure when getting previous track."
        );
      }
    );
  });

  // Test #7
  it("player is playing and user plays PREVIOUS track, returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
            progressMs: 0,
            durationMs: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({ status: Status.TESTING });
      })

    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        "Unknown error when getting previous track."
      );
    });
  });
});
