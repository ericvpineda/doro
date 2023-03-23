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
      // global.chrome.runtime.sendMessage = jest.fn();
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
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toBeCalledTimes(0);
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
        .mockImplementationOnce((obj, callback) => {
            callback({
                status: Status.ERROR,
                error: {
                    message: "Error when completing track command.",
                  },
                });
              })
              .mockImplementation((obj, callback) =>
                callback({
                    status: Status.SUCCESS,
                    data: { track: "", artist: "" },
                  })
                );

    render(<SpotifyPlayer />);
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
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
            )
            .mockImplementation((obj, callback) =>
              callback({
                  status: Status.SUCCESS,
                  data: { track: "", artist: "" },
                })
              );

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
                  },
                });
              })
              .mockImplementationOnce((obj, callback) =>
                callback({ status: Status.FAILURE })
              )
              .mockImplementation((obj, callback) =>
                callback({
                    status: Status.SUCCESS,
                    data: { track: "", artist: "" },
                  })
                );

              // Mock getting spotify tab
              global.chrome.tabs.query = (_, callback) => {
      callback([{ url: "https://www.spotify.com", id: 1 }]);
    };

    // Mock script injection function
    global.chrome.scripting = {
      executeScript: async ({ target, func }) => {
        return new Promise((resolve, reject) => resolve(func()));
      },
    };

    render(<SpotifyPlayer />);
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    await waitFor(
        () => {
            expect(logSpy).toHaveBeenCalledWith("Failure when getting next track.");
          },
          { timeout: 1000 }
        );
      });

      it("player is playing and non-premium user plays NEXT track, injection script returns failure", async () => {
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
          callback({
              status: Status.FAILURE,
              error: {
                  message:
                    "This is used to prevent coverage from complaing about get track error message.",
                },
              });
            })
            .mockImplementation((obj, callback) =>
              callback({
                  status: Status.SUCCESS,
                  data: { track: "", artist: "" },
                })
      );

    // Mock getting spotify tab
    global.chrome.tabs.query = (_, callback) => {
        callback([{ url: "https://www.spotify.com", id: 1 }]);
      };

      // Mock script injection function
      global.chrome.scripting = {
          executeScript: async ({ target, func }) => {
              return new Promise((resolve, reject) => reject(func()));
            },
          };

    render(<SpotifyPlayer />);
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    await waitFor(
        () => {
            expect(logSpy).toHaveBeenCalledWith("Failure when getting next track.");
          },
          { timeout: 1000 }
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
            if (typeof callback === "function") {
                callback({ status: Status.TESTING });
              }
            });

          render(<SpotifyPlayer />);
          const nextTrackBtn = screen.getByTestId("next-track-btn");
          await user.click(nextTrackBtn);

          expect(logSpy).toHaveBeenCalledWith(
              "Unknown error when getting next track."
            );
  });
});
