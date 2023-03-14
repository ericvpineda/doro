import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { chrome } from "jest-chrome";
import { Status } from "../../../Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

// Test Points
// - track commands/functions
//  - getting track
//  - pause, play, next, previous, save, remove saved
//  - volume change (committed)
//  - change track thumb position
// - note:
//  - isExecutingRequest is assumed to be true (in order to make player active)
//  - how to test setInterval for thumbPosition tick correctness?

// Tests for SpotifyPlayer component
describe("Test SpotifyPlayer component", () => {
  let mockFxn, user, logSpy;
  beforeEach(() => {
    mockFxn = jest.fn();
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

  it("player GETS track successfully", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "",
        },
      });
    });
    render(<SpotifyPlayer />);
    expect(logSpy).toBeCalledTimes(0);
  });

  it("player GETS track and returns failure", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        message: "Web player not open in browser.",
      });
    });
    render(<SpotifyPlayer />);
    expect(logSpy).toHaveBeenCalledWith("Web player not open in browser.");
  });

  it("players GETS track and returns error", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.ERROR,
        message: "Error occured when getting track data.",
      });
    });
    render(<SpotifyPlayer />);
    expect(logSpy).toHaveBeenCalledWith(
      "Error occured when getting track data."
    );
  });

  it("players GETS track and returns unknown error", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.ERROR,
        message: "Unknown error when getting track data.",
      });
    });
    render(<SpotifyPlayer />);
    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when getting track data."
    );
  });

  it("player is playing and user PAUSES track, returns success", async () => {
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
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("player is playing and non-premium user PAUSES track, returns success", async () => {
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
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  // Returns failure since necessary DOM elements not loaded
  it("player is playing and non-premium user PAUSES track, returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when pausing track.");
  });

  it("player is playing and non-premium user PAUSES track, injection script returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({});
      });
    render(<SpotifyPlayer />);
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toHaveBeenCalledWith("Unknown error when pausing track.");
  });

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
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
    const playBtn = screen.getByTestId("play-btn");
    await user.click(playBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when playing track.");
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
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
      );

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
    const playBtn = screen.getByTestId("play-btn");
    await user.click(playBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when playing track.");
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
      .mockImplementation((obj, callback) => {
        callback({});
      });
    render(<SpotifyPlayer />);
    const playBtn = screen.getByTestId("play-btn");
    await user.click(playBtn);

    expect(logSpy).toHaveBeenCalledWith("Unknown error when playing track.");
  });

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
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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

    expect(logSpy).toHaveBeenCalledWith("Failure when getting next track.");
  });

  it("player is playing and non-premium user plays NEXT track, injection script returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
      );

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
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when getting next track.");
  });

  it("player is playing and user plays NEXT track, returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
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

  it("player is playing and user plays PREVIOUS track, returns success", async () => {
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
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    expect(logSpy).toBeCalledTimes(0);
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
            isPlaying: true,
          },
        });
      })
      // Mock response from background script
      .mockImplementation((obj, callback) => {
        callback({ status: Status.FAILURE });
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
    expect(prevTrackBtn).toBeVisible();
    await user.click(prevTrackBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("non-premium user plays PREVIOUS track, returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({ status: Status.FAILURE });
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
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when getting previous track.");
  });

  it("non-premium user plays PREVIOUS track, injection script returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({ status: Status.FAILURE });
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
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Failure when getting previous track.");
  });

  it("player is playing and user plays PREVIOUS track, returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
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
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when getting previous track."
    );
  });

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

    expect(logSpy).toBeCalledTimes(0);
  });

  it("user SAVES track and returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
          message: "Failure when completing track command.",
        });
      });
    render(<SpotifyPlayer />);
    const saveTrackBtn = screen.getByTestId("save-track-btn");
    await user.click(saveTrackBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Failure when completing track command."
    );
  });

  it("user SAVES track and returns unknown error", async () => {
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
      .mockImplementation((obj, callback) => {
        callback({ status: Status.ERROR });
      });
    render(<SpotifyPlayer />);
    const saveTrackBtn = screen.getByTestId("save-track-btn");
    await user.click(saveTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Unknown error when saving track.");
  });

  it("user REMOVES track and returns success", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            isSaved: true,
            track: "",
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
        });
      });
    render(<SpotifyPlayer />);
    const removeTrackBtn = screen.getByTestId("remove-track-btn");
    await user.click(removeTrackBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("user REMOVES track and returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            isSaved: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
          message: "Failure when completing track command.",
        });
      });
    render(<SpotifyPlayer />);
    const removeTrackBtn = screen.getByTestId("remove-track-btn");
    await user.click(removeTrackBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Failure when completing track command."
    );
  });
  it("user REMOVES track and returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: false,
            isSaved: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({});
      });
    render(<SpotifyPlayer />);
    const removeTrackBtn = screen.getByTestId("remove-track-btn");
    await user.click(removeTrackBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when removing user track."
    );
  });

  // VolumeSlider tests that NEED SpotifyPlayer component are listed below

  // Note: Don't need manually render volume-btn, volume-slider bc VolumeSlider is subcomponent
  it("user changes VOLUME and returns success", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 0,
            track: "",
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
        });
      });
    render(<SpotifyPlayer />);
    const volumeBtn = screen.getByTestId("volume-btn");
    await user.hover(volumeBtn);

    const volumeSlider = screen.getByTestId("volume-slider");
    expect(volumeSlider).toBeVisible();

    await act(() => {
      fireEvent.mouseDown(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom,
      });
      fireEvent.mouseMove(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
      fireEvent.mouseUp(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
    });

    expect(logSpy).toBeCalledTimes(0);
  });

  // Note: Spotify browser elements not to document, should throw error
  it("non-premium user changes VOLUME and returns failure", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 0,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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
    const volumeBtn = screen.getByTestId("volume-btn");
    await user.hover(volumeBtn);

    const volumeSlider = screen.getByTestId("volume-slider");
    expect(volumeSlider).toBeVisible();

    await act(() => {
      fireEvent.mouseDown(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom,
      });
      fireEvent.mouseMove(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
      fireEvent.mouseUp(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
    });

    // Note: Do not place expect() in waitFor function (will show false success)
    expect(logSpy).toHaveBeenCalledWith("Failure when setting track volume.");
  });

  // Note: does not mimic same environment since popup and "browser" have shared html
  it("non-premium user changes VOLUME and injection script returns failure", async () => {
    // Mock document to have volume slider since injecting on spotify volume slider
    const volumeBar = document.createElement("div");
    volumeBar.setAttribute("data-testid", "volume-bar");
    const progressBar = document.createElement("div");
    progressBar.setAttribute("data-testid", "progress-bar");
    volumeBar.appendChild(progressBar);
    document.body.appendChild(volumeBar);

    expect(volumeBar).toBeInTheDocument();
    expect(progressBar).toBeInTheDocument();

    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 24,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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

    const volumeBtn = screen.getByTestId("volume-btn");
    await user.hover(volumeBtn);

    const volumeSlider = screen.getByTestId("volume-slider");
    expect(volumeSlider).toBeVisible();

    await act(() => {
      fireEvent.mouseDown(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom,
      });
      fireEvent.mouseMove(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
      fireEvent.mouseUp(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
    });

    expect(logSpy).toHaveBeenCalledWith("Failure when setting track volume.");
  });

  it("non-premium user changes VOLUME and returns success", async () => {
    // Mock document to have volume slider since injecting on spotify volume slider
    const volumeBar = document.createElement("div");
    volumeBar.setAttribute("data-testid", "volume-bar");
    const progressBar = document.createElement("div");
    progressBar.setAttribute("data-testid", "progress-bar");
    volumeBar.appendChild(progressBar);
    document.body.appendChild(volumeBar);

    expect(volumeBar).toBeInTheDocument();
    expect(progressBar).toBeInTheDocument();

    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 24,
          },
        });
      })
      .mockImplementation((obj, callback) =>
        callback({ status: Status.FAILURE })
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

    const volumeBtn = screen.getByTestId("volume-btn");
    await user.hover(volumeBtn);

    const volumeSlider = screen.getByTestId("volume-slider");
    expect(volumeSlider).toBeVisible();
    expect(volumeSlider.querySelector("input").value).toBe("24");

    await act(() => {
      fireEvent.mouseDown(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom,
      });
      fireEvent.mouseMove(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
      fireEvent.mouseUp(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
    });

    expect(logSpy).toBeCalledTimes(0);
  });

  it("user changes VOLUME and returns unknown error", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({ status: Status.TESTING });
      });
    render(<SpotifyPlayer />);
    const volumeBtn = screen.getByTestId("volume-btn");
    await user.hover(volumeBtn);

    const volumeSlider = screen.getByTestId("volume-slider");
    expect(volumeSlider).toBeVisible();

    await act(() => {
      fireEvent.mouseDown(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom,
      });
      fireEvent.mouseMove(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
      fireEvent.mouseUp(volumeSlider, {
        clientY: volumeSlider.getBoundingClientRect().bottom + 1,
      });
    });

    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when setting track volume."
    );
  });

  it("volume greater than zero and premium user click volume button, sets volume to zero", async () => {
    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 100,
            track: "",
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
        });
      });
    render(<SpotifyPlayer />);
    const volumeBtn = screen.getByTestId("volume-btn");
    await user.click(volumeBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("volume greater than zero and non-premium user click volume button, sets volume to zero", async () => {
    // Mock document to have volume slider since injecting on spotify volume slider
    const volumeBar = document.createElement("div");
    volumeBar.setAttribute("data-testid", "volume-bar");
    const progressBar = document.createElement("div");
    progressBar.setAttribute("data-testid", "progress-bar");
    volumeBar.appendChild(progressBar);
    document.body.appendChild(volumeBar);

    expect(volumeBar).toBeInTheDocument();
    expect(progressBar).toBeInTheDocument();

    global.chrome.runtime.sendMessage
      .mockImplementationOnce((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            volumePercent: 100,
            track: "",
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
        });
      });
    render(<SpotifyPlayer />);
    const volumeBtn = screen.getByTestId("volume-btn");
    await user.hover(volumeBtn);

    const volumeSlider = screen.getByTestId("volume-slider");
    expect(volumeSlider).toBeVisible();

    expect(logSpy).toBeCalledTimes(0);
  });

  it("premium user SEEKS track and returns success", async () => {
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
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
        });
      });
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
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
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

    expect(logSpy).toHaveBeenCalledWith("Failure when seeking track.");
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
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
        });
      });

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

    expect(logSpy).toHaveBeenCalledWith("Failure when seeking track.");
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
            progress: 0,
            duration: 0,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.FAILURE,
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
      .mockImplementation((obj, callback) => {
        callback({
          status: Status.TESTING,
        });
      });
    render(<SpotifyPlayer/>);
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

    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when seeking track volume."
    );
  });
});
