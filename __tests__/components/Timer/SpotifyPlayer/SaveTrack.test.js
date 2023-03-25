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

// Tests for SpotifyPlayer component
describe("Test SpotifyPlayer component save track", () => {
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

  // // ----- SAVE TRACK TESTS -----

  it("user SAVES track and returns success", async () => {
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
    const saveTrackBtn = screen.getByTestId("save-track-btn");
    await user.click(saveTrackBtn);

    await waitFor(() => {
    expect(logSpy).toBeCalledTimes(0);
    })
  });

  it("user SAVES track and returns error", async () => {
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
          data: {
            artist: "",
            track: "",
            isPlaying: false,
          },
        })
      );

    render(<SpotifyPlayer />);
    const saveTrackBtn = screen.getByTestId("save-track-btn");
    await user.click(saveTrackBtn);

    await waitFor(() => {
    expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
    })
  });

  it("user SAVES track and returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: false,
          },
        });
      })
      .mockImplementationOnce((obj, callback) => {
        callback({ status: Status.TESTING });
      })
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: false,
          },
        });
      });

    render(<SpotifyPlayer />);
    const saveTrackBtn = screen.getByTestId("save-track-btn");
    await user.click(saveTrackBtn);

    await waitFor(
      () => {
        expect(logSpy).toHaveBeenCalledWith("Unknown error when saving track.");
      },
      { timeout: 1000 }
    );
  })
})