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
import { PlayerActions } from "../../../../src/Utils/SpotifyUtils";

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
    // global.chrome.runtime.sendMessage = jest.fn();
    document.body.innerHTML = "";
  });

// ----- PREVIOUS TRACK TESTS -----

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

    expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2);
    expect(logSpy).toBeCalledTimes(0);
  });

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

    expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2);
    expect(logSpy).toBeCalledTimes(0);
  });

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
      .mockImplementationOnce((obj, callback) => {
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
            artist: "",
            track: "",
            isPlaying: true,
            progressMs: 0,
            durationMs: 0,
          },
        });
      })
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
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.FAILURE,
          error: { message: "" },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
          },
        });
      });

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
    await user.click(prevTrackBtn);

    await waitFor(() => {
      // expect(global.chrome.runtime.sendMessage).toBeCalledTimes(5);
      expect(logSpy).toBeCalledTimes(0);
      expect(global.chrome.runtime.sendMessage).toBeCalledWith(
        { message: PlayerActions.GET_CURRENTLY_PLAYING },
        expect.any(Function)
      );
    });
  });

  it("non-premium user plays PREVIOUS track, returns failure", async () => {
    // Mock initial call to get track information
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
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.FAILURE,
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
          },
        });
      });

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
    await user.click(prevTrackBtn);
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledWith(
        { message: PlayerActions.GET_CURRENTLY_PLAYING },
        expect.any(Function)
        // { message: PlayerActions.PREVIOUS },
      );
      expect(logSpy).toHaveBeenCalledWith(
        "Failure when getting previous track."
      );
      // expect(global.chrome.runtime.sendMessage).toBeCalledTimes(5)
    }, {timeout: 2000});
  });

  it("non-premium user plays PREVIOUS track, injection script returns failure", async () => {
    // Mock document to have track button
    document.body.innerHTML = `<div>
        <button data-testid="control-button-skip-back"></button>
      </div>`;

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
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.FAILURE,
        });
      })
      .mockImplementation((obj, callback) =>
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
            progressMs: 0,
            durationMs: 0,
          },
        })
      );

    // Mock getting spotify tab
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://www.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: ({ target, func }) => {
        return new Promise((resolve, reject) => {
          reject(func());
        });
      },
    };

    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);
    await user.click(prevTrackBtn);
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        "Failure when getting previous track."
      );
    }, {timeout: 4000});
  });

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
      .mockImplementationOnce((obj, callback) => {
        callback({ status: Status.TESTING });
      }).mockImplementation((obj, callback) => {
        if (typeof callback === "function") { 
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
        }
      })

    render(<SpotifyPlayer />);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);
    await user.click(prevTrackBtn);
    await user.click(prevTrackBtn);

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        "Unknown error when getting previous track."
      );
    }, {timeout: 4000});
  });
});

