import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../../src/Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { Status } from "../../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

// Note:
// - Assertions dealing with chrome.sendMessage needs to be wrapped in waitFor
//  - Else, will have async errors
// - Need to timeout waitFor since successful calls to next track has setTimeout <= 500ms
// - Need second mockimplementation on successful next track calls since calls get track 2x

describe("Test SpotifyPlayer component next track", () => {
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

  // ----- NEXT TRACK TESTS -----

  it("player is playing and user plays NEXT track, returns success", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "",
          isPlaying: true,
        },
      });
    });
    render(<SpotifyPlayer />);
    const button = screen.getByTestId("next-track-btn");
    await user.click(button);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(3)
      expect(logSpy).toBeCalledTimes(0);
    }, {timeout: 2000})
  });

  it("player is playing and user plays NEXT track, returns error", async () => {
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
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.ERROR,
          error: {
            message: "Error when completing track command.",
          },
        });
      })

    render(<SpotifyPlayer />);
    const button = screen.getByTestId("next-track-btn");
    await user.click(button);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(2)
      expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
    }, {timeout: 2000})
  });

  it("player is playing and non-premium user plays NEXT track, returns success", async () => {
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
            track: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementationOnce((obj, callback) =>
        callback({ status: Status.FAILURE })
      ).mockImplementationOnce((obj, callback) => { // Note: successful script injection will call get track again
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
          },
        });
      })

    // Mock getting spotify tab
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
    const button = screen.getByTestId("next-track-btn");
    await user.click(button);

    await waitFor(() => {
      expect(global.chrome.runtime.sendMessage).toBeCalledTimes(3)
      expect(logSpy).toBeCalledTimes(0);
    }, {timeout: 2000})
  });

  it("player is playing and non-premium user plays NEXT track, returns failure", async () => {
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
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
      )

    // Mock getting spotify tab
    global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://open.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: async ({ target, func }) => {
        return new Promise((resolve, reject) => resolve([{result: func()}]));
      },
    };

    render(<SpotifyPlayer />);
    const button = screen.getByTestId("next-track-btn");
    await user.click(button);

    await waitFor(
      () => {
        expect(logSpy).toHaveBeenCalledWith("Failure when getting next track.");
      }, {timeout: 2000}
    );
  });

  it("player is playing and non-premium user plays NEXT track, injection script returns failure", async () => {

    global.chrome.runtime.sendMessage
        .mockImplementationOnce((obj, callback) => {
          callback({
            status: Status.SUCCESS,
            data: {
              artist: "",
              isPlaying: false,
            },
          });
        })
        .mockImplementation((obj, callback) =>
          callback({ status: Status.FAILURE })
        )
  
      // Mock getting spotify tab
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
      const button = screen.getByTestId("next-track-btn");
      await user.click(button);
  
      await waitFor(
        () => {
          expect(logSpy).toHaveBeenCalledWith("Failure when getting next track.");
        }, {timeout: 2000}
      );
  });

  it("player is playing and user plays NEXT track, returns unknown error", async () => {
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
      .mockImplementation((obj, callback) => {
        callback({ status: Status.TESTING });
      });

    render(<SpotifyPlayer />);
    const button = screen.getByTestId("next-track-btn");
    await user.click(button);

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        "Unknown error when getting next track."
      );
    }, {timeout: 2000})
  });
});
