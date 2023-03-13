import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyPlayer from "../../../Components/Timer/SpotifyPlayer/SpotifyPlayer";
import { chrome } from "jest-chrome";
import { Status } from "../../../Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";
import { it } from "node:test";

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
    document.body.innerHTML = ""; // Clear modified body elements
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

    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const pauseBtn = screen.getByTestId("pause-btn");
    await user.click(pauseBtn);

    expect(logSpy).toBeCalledTimes(0);
  });

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

    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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

    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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

    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const nextTrackBtn = screen.getByTestId("next-track-btn");
    await user.click(nextTrackBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Failure when completing track command."
    );
  });

  it("player is playing and user plays NEXT track, returns unknown error", async () => {
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
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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

    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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

    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
        callback({ status: Status.ERROR });
      });
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
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
            isSaved: true,
          },
        });
      })
      .mockImplementation((obj, callback) => {
        callback({});
      });
    render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
    const removeTrackBtn = screen.getByTestId("remove-track-btn");
    await user.click(removeTrackBtn);

    expect(logSpy).toHaveBeenCalledWith(
      "Unknown error when removing user track."
    );
  });

  // it("user changes VOLUME and returns success", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 0,
  //           track: "",
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const volumeBtn = screen.getByTestId("volume-btn");
  //   await user.hover(volumeBtn);

  //   const volumeSlider = screen.getByTestId("volume-slider");
  //   expect(volumeSlider).toBeVisible();

  //   // Need to get input query selector beforehand
  //   fireEvent.change(volumeSlider.querySelector("input"), {
  //     target: { value: 25 },
  //   });
  //   await user.click(volumeSlider);

  //   expect(logSpy).toBeCalledTimes(0);
  // });

  // it("user changes VOLUME and returns failure", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 0,
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.FAILURE,
  //         message: "Failure when completing track command.",
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const volumeBtn = screen.getByTestId("volume-btn");
  //   await user.hover(volumeBtn);

  //   const volumeSlider = screen.getByTestId("volume-slider");
  //   expect(volumeSlider).toBeVisible();

  //   // Need to get input query selector beforehand
  //   fireEvent.change(volumeSlider.querySelector("input"), {
  //     target: { value: 25 },
  //   });
  //   await user.click(volumeSlider);

  //   expect(logSpy).toHaveBeenCalledWith(
  //     "Failure when completing track command."
  //   );
  // });

  // it("user changes VOLUME and returns unknown error", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 0,
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.ERROR,
  //         message: "Unknown error when setting track volume.",
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const volumeBtn = screen.getByTestId("volume-btn");
  //   await user.hover(volumeBtn);

  //   const volumeSlider = screen.getByTestId("volume-slider");
  //   expect(volumeSlider).toBeVisible();

  //   // Need to get input query selector beforehand
  //   fireEvent.change(volumeSlider.querySelector("input"), {
  //     target: { value: 25 },
  //   });
  //   await user.click(volumeSlider);

  //   expect(logSpy).toHaveBeenCalledWith(
  //     "Unknown error when setting track volume."
  //   );
  // });

  // it("volume greater than zero and user click volume button, sets volume to zero", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 100,
  //           track: "",
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const volumeBtn = screen.getByTestId("volume-btn");
  //   await user.hover(volumeBtn);

  //   const volumeSlider = screen.getByTestId("volume-slider");
  //   expect(volumeSlider).toBeVisible();

  //   // Need to get input query selector beforehand
  //   fireEvent.change(volumeSlider.querySelector("input"), {
  //     target: { value: 0 },
  //   });
  //   await user.click(volumeSlider);

  //   expect(logSpy).toBeCalledTimes(0);
  // });

  // it("user SEEKS track and returns success", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 0,
  //           track: "",
  //           progress: 0,
  //           duration: 0,
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const seekPositionSlider = screen.getByTestId("seek-position-slider");
  //   // Need to get input query selector beforehand
  //   fireEvent.change(seekPositionSlider.querySelector("input"), {
  //     target: { value: 25 },
  //   });
  //   await user.click(seekPositionSlider);

  //   expect(logSpy).toBeCalledTimes(0);
  // });

  // it("user SEEKS track and returns failure", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 0,
  //           track: "",
  //           progress: 0,
  //           duration: 0,
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.FAILURE,
  //         message: "Failure when completing track command.",
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const seekPositionSlider = screen.getByTestId("seek-position-slider");
  //   // Need to get input query selector beforehand
  //   fireEvent.change(seekPositionSlider.querySelector("input"), {
  //     target: { value: 25 },
  //   });
  //   await user.click(seekPositionSlider);

  //   expect(logSpy).toHaveBeenCalledWith(
  //     "Failure when completing track command."
  //   );
  // });

  // it("user SEEKS track and returns unknown error", async () => {
  //   global.chrome.runtime.sendMessage
  //     .mockImplementationOnce((obj, callback) => {
  //       callback({
  //         status: Status.SUCCESS,
  //         data: {
  //           artist: "",
  //           isPlaying: true,
  //           volume: 0,
  //           track: "",
  //           progress: 0,
  //           duration: 0,
  //         },
  //       });
  //     })
  //     .mockImplementation((obj, callback) => {
  //       callback({
  //         status: Status.ERROR,
  //         message: "Unknown error when seeking track volume.",
  //       });
  //     });
  //   render(<SpotifyPlayer setShowPlayerHandler={mockFxn}></SpotifyPlayer>);
  //   const seekPositionSlider = screen.getByTestId("seek-position-slider");
  //   // Need to get input query selector beforehand
  //   fireEvent.change(seekPositionSlider.querySelector("input"), {
  //     target: { value: 25 },
  //   });
  //   await user.click(seekPositionSlider);

  //   expect(logSpy).toHaveBeenCalledWith(
  //     "Unknown error when seeking track volume."
  //   );
  // });

  // TODO-LATER: Do after premium user actions complete
  test.todo(
    "ad is playing and user attempts to skip, skip button should be disabled"
  );
});
