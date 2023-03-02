import React from "react";
import { render, screen } from "@testing-library/react";
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    expect(logSpy).toBeCalledTimes(0);
  });

  it("player GETS track and returns failure", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        message: "Web player not open in browser.",
      });
    });
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    expect(logSpy).toHaveBeenCalledWith("Web player not open in browser.");
  });

  it("players GETS track and returns error", () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
      callback({
        status: Status.ERROR,
        message: "Error occured when getting track data.",
      });
    });
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("player is playing and user PAUSES track, returns failure", async () => {
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Failure when completing track command."
    );
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const playBtn = screen.getByTestId("play-btn");
    await user.click(playBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

  it("player is paused and user PLAYS track, returns failure", async () => {
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
        callback({
          status: Status.FAILURE,
          message: "Failure when completing track command.",
        });
      });
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const playBtn = screen.getByTestId("play-btn");
    await user.click(playBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Failure when completing track command."
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
      .mockImplementation((obj, callback) => {
        callback({});
      });
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
      render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
      const nextTrackBtn = screen.getByTestId("next-track-btn");
      await user.click(nextTrackBtn);
  
      expect(logSpy).toBeCalledTimes(0);
  });

  it("player is playing and user plays NEXT track, returns failure", async () => {
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
  render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  const nextTrackBtn = screen.getByTestId("next-track-btn");
  await user.click(nextTrackBtn);

  expect(logSpy).toHaveBeenCalledWith(
    "Failure when completing track command."
  );
  });

  it(
    "player is playing and user plays NEXT track, returns unknown error"
  , async () => {
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Unknown error when getting next track.");
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
      render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
      const prevTrackBtn = screen.getByTestId("previous-track-btn");
      await user.click(prevTrackBtn);
  
      expect(logSpy).toBeCalledTimes(0);
  });

  it("player is playing and user plays PREVIOUS track, returns failure", async () => {
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
  render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  const prevTrackBtn = screen.getByTestId("previous-track-btn");
  await user.click(prevTrackBtn);

  expect(logSpy).toHaveBeenCalledWith(
    "Failure when completing track command."
  );
  });
  it(
    "player is playing and user plays PREVIOUS track, returns unknown error"
  , async () => {
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const prevTrackBtn = screen.getByTestId("previous-track-btn");
    await user.click(prevTrackBtn);

    expect(logSpy).toHaveBeenCalledWith("Unknown error when getting previous track.");
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
      render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
  render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
      callback({});
    });
  render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  const saveTrackBtn = screen.getByTestId("save-track-btn");
  await user.click(saveTrackBtn);

  expect(logSpy).toHaveBeenCalledWith("Unknown error when saving track.");
  });

  it("user REMOVES track and returns success", async () => {
    global.chrome.runtime.sendMessage.mockImplementation((obj, callback) => {
        callback({
          status: Status.SUCCESS,
          data: {
            artist: "",
            isPlaying: true,
            isSaved: true
          },
        });
      });
      render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
          isSaved: true
        },
      });
    })
    .mockImplementation((obj, callback) => {
      callback({
        status: Status.FAILURE,
        message: "Failure when completing track command.",
      });
    });
  render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
          isSaved: true
        },
      });
    })
    .mockImplementation((obj, callback) => {
      callback({});
    });
  render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  const removeTrackBtn = screen.getByTestId("remove-track-btn");
  await user.click(removeTrackBtn);

  expect(logSpy).toHaveBeenCalledWith("Unknown error when removing user track.");
  });

  test.todo("user changes VOLUME and returns success");
  test.todo("user changes VOLUME and returns failure");
  test.todo("user changes VOLUME and returns error");
  test.todo("user changes VOLUME and returns unknown error");

  test.todo(
    "volume is greater than zero and user presses volume button, sets volume to zero"
  );

  test.todo("user SEEKS track and returns success");
  test.todo("user SEEKS track and returns failure");
  test.todo("user SEEKS track and returns error");
  test.todo("user SEEKS track and returns unknown error");

  test.todo("ad is playing and user attempts to skip, skip button should be disabled")
  test.todo("podcast is playing and user attempts to...")
});
