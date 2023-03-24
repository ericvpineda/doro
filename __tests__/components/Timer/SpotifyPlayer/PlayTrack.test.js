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
describe("Test SpotifyPlayer component play track", () => {
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
  
  // ----- PLAY TRACK TESTS -----
  
    it("player is paused and user PLAYS track, returns success", async () => {
      global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: false,
          },
        });
      });
      render(<SpotifyPlayer />);
      const playBtn = screen.getByTestId("play-btn");
      await user.click(playBtn);
  
      expect(logSpy).toBeCalledTimes(0);
    });
  
    it("player is paused and user PLAYS track, returns error", async () => {
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
      const playBtn = screen.getByTestId("play-btn");
      await user.click(playBtn);
  
      expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
    });
  
    it("player is paused and non-premium user PLAYS track, returns success", async () => {
      // Mock document to have track button
      document.body.innerHTML = `<div>
      <button data-testid="control-button-playpause"></button>
    </div>`;
  
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
        callback([{ url: "https://open.spotify.com", id: 1 }]);
      };
  
      // Mock script injection function
      global.chrome.scripting = {
        executeScript: ({ target, func }) => {
          return new Promise((resolve, reject) => resolve([{result: func()}]));
        },
      };
  
      render(<SpotifyPlayer />);
      const playBtn = screen.getByTestId("play-btn");
      await user.click(playBtn);
  
      expect(logSpy).toBeCalledTimes(0);
    });
  
    it("player is paused and non-premium user PLAYS track, returns failure", async () => {
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
        callback([{ url: "https://open.spotify.com", id: 1 }]);
      };
  
      // Mock script injection function
      global.chrome.scripting = {
        executeScript: ({ target, func }) => {
          return new Promise((resolve, reject) => resolve([{result: func()}]));
        },
      };
  
      render(<SpotifyPlayer />);
      const playBtn = screen.getByTestId("play-btn");
      await user.click(playBtn);
  
      await waitFor(
        () => {
          expect(logSpy).toHaveBeenCalledWith("Failure when playing track.");
        },
        { timeout: 1000 }
      );
    });
  
    it("player is paused and non-premium user PLAYS track, injection script returns failure", async () => {
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
        callback([{ url: "https://open.spotify.com", id: 1 }]);
      };
  
      // Mock script injection function
      global.chrome.scripting = {
        executeScript: ({ target, func }) => {
          return new Promise((resolve, reject) => reject(func()));
        },
      };
  
      render(<SpotifyPlayer />);
      const playBtn = screen.getByTestId("play-btn");
      await user.click(playBtn);
  
      await waitFor(
        () => {
          expect(logSpy).toHaveBeenCalledWith("Failure when playing track.");
        },
        { timeout: 1000 }
      );
    });
  
    it("player is paused and user PLAYS track, returns unknown error", async () => {
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
        .mockImplementationOnce((obj, callback) => {
          callback({ status: Status.TESTING });
        })
        .mockImplementation((obj, callback) =>
          callback({
            status: Status.SUCCESS,
            data: { track: "", artist: "" },
          })
        );
  
      render(<SpotifyPlayer />);
      const playBtn = screen.getByTestId("play-btn");
      await user.click(playBtn);
  
      expect(logSpy).toHaveBeenCalledWith("Unknown error when playing track.");
    });

})