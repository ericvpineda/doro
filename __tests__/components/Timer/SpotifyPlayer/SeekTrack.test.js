import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../../src/Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { Status } from "../../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

// Tests for SpotifyPlayer component
describe("Test SpotifyPlayer component seek track", () => {
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

  // ----- SEEK TRACK TESTS -----

  it("user SEEKS track and returns success", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            track: "",
            isPlaying: true,
            volumePercent: 0,
            track: "",
            progress: 0,
            duration: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            track: "",
            artist: "",
          },
        });
      })
  

    render(<SpotifyPlayer />);
    const seekTrackSlider = screen.getByTestId("seek-position-slider");

    // Note: Need to wait so setInterval in SpotifySlider will run for 1 second
    setTimeout(async () => {
      await act(() => {
        fireEvent.mouseDown(seekTrackSlider, {
          clientX: seekTrackSlider.getBoundingClientRect().left,
        });
        fireEvent.mouseMove(seekTrackSlider, {
          clientX: seekTrackSlider.getBoundingClientRect().left + 1,
        });
        fireEvent.mouseUp(seekTrackSlider, {
          clientX: seekTrackSlider.getBoundingClientRect().left + 1,
        });
      });
    }, 2000);

    await waitFor(
      () => {
        expect(logSpy).toBeCalledTimes(0);
      },
      { timeout: 2000 }
    );
  });

  it("user SEEKS track and returns error", async () => {
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
          },
        });
      })

    render(<SpotifyPlayer />);
    const seekTrackSlider = screen.getByTestId("seek-position-slider");

    await act(() => {
      fireEvent.mouseDown(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left,
      });
      fireEvent.mouseMove(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
      fireEvent.mouseUp(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
    });

    await waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
    })
  });

  it("non-premium user SEEKS track and returns failure", async () => {
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
            isPlaying: true,
            volumePercent: 0,
            track: "",
            progress: 0,
            duration: 0,
          },
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
    const seekTrackSlider = screen.getByTestId("seek-position-slider");
    // const browserTrackSlider = screen.getByTestId("playback-progressbar");
    // expect(browserTrackSlider).not.toBeInTheDocument();

    await act(() => {
      fireEvent.mouseDown(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left,
      });
      fireEvent.mouseMove(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
      fireEvent.mouseUp(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
    });

    await waitFor(
      () => {
        expect(logSpy).toHaveBeenCalledWith("Failure when seeking track.");
      },
      { timeout: 2000 }
    );
  });

  it("non-premium user SEEKS track and returns injection script failure", async () => {
    // Mock document to have volume slider since injecting on spotify volume slider
    const playbackBar = document.createElement("div");
    playbackBar.setAttribute("data-testid", "playback-progressbar");
    const progressBar = document.createElement("div");
    progressBar.setAttribute("data-testid", "progress-bar");
    playbackBar.appendChild(progressBar);
    document.body.appendChild(playbackBar);

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
          data: { track: "", artist: "" },
        })
      );

    // Mock getting spotify tab in chrome browser
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
    const seekTrackSlider = screen.getByTestId("seek-position-slider");

    await act(() => {
      fireEvent.mouseDown(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left,
      });
      fireEvent.mouseMove(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
      fireEvent.mouseUp(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
    });

    await waitFor(
      () => {
        expect(logSpy).toHaveBeenCalledWith("Failure when seeking track.");
      },
      { timeout: 2000 }
    );
  });

  it("non-premium user SEEKS track and returns success", async () => {
    // Mock document to have volume slider since injecting on spotify volume slider
    const playbackBar = document.createElement("div");
    playbackBar.setAttribute("data-testid", "playback-progressbar");
    const progressBar = document.createElement("div");
    progressBar.setAttribute("data-testid", "progress-bar");
    playbackBar.appendChild(progressBar);
    document.body.appendChild(playbackBar);

    expect(playbackBar).toBeInTheDocument();
    expect(progressBar).toBeInTheDocument();

    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 0,
            track: "",
            progress: 1,
            duration: 1000,
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
          data: { track: "", artist: "" },
        })
      );

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
    const seekTrackSlider = screen.getByTestId("seek-position-slider");

    await act(() => {
      fireEvent.mouseDown(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left,
      });
      fireEvent.mouseMove(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
      fireEvent.mouseUp(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
    });

    expect(logSpy).toBeCalledTimes(0);
  });

  it("user SEEKS track and returns unknown error", async () => {
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
          },
        });
      })
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.TESTING,
        });
      })
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
          },
        });
      })

    render(<SpotifyPlayer />);
    const seekTrackSlider = screen.getByTestId("seek-position-slider");

    await act(() => {
      fireEvent.mouseDown(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left,
      });
      fireEvent.mouseMove(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
      fireEvent.mouseUp(seekTrackSlider, {
        clientX: seekTrackSlider.getBoundingClientRect().left + 1,
      });
    });

    await waitFor(() => {
        expect(logSpy).toHaveBeenCalledWith(
          "Unknown error when seeking track volume."
        );
    })
  });
});
