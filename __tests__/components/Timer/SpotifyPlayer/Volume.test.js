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

// Note:
// - update spotify regex to "https://open.spotify.com"
// - update resolve function to be "resolve([{result: func()}])"

// Tests for SpotifyPlayer component
describe("Test SpotifyPlayer component volume", () => {
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


// ----- VOLUME SLIDER TESTS -----

// Note: Don't need manually render volume-btn, volume-slider bc VolumeSlider is subcomponent
it("user changes VOLUME and returns success", async () => {
  global.chrome.runtime.sendMessage
    .mockImplementationOnce((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "",
          isPlaying: true,
          volumePercent: 1,
          track: "",
          type: "track",
        },
      });
    })
    .mockImplementationOnce((obj, callback) => {
      callback({
        status: Status.SUCCESS,
      });
    })
    .mockImplementation((obj, callback) =>
      callback({
        status: Status.SUCCESS,
        data: { track: "", artist: "" },
      })
    );

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

  // Unhover volume button event
  await act(() => {
    fireEvent.mouseOut(volumeBtn);
  });

  await waitFor(() => {
    expect(logSpy).toBeCalledTimes(0);
  })
});

// Note: Don't need manually render volume-btn, volume-slider bc VolumeSlider is subcomponent
it("user changes VOLUME and returns error", async () => {
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

  // Unhover volume button event
  await act(() => {
    fireEvent.mouseOut(volumeBtn);
  });

  await waitFor(() => {
    expect(logSpy).toHaveBeenCalledWith("Error when completing track command.");
  })
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
    )
 
  // Mock getting spotify tab in chrome browser
  global.chrome.tabs.query = (_, callback) => {
    callback([{ url: "https://open.spotify.com", id: 1 }]);
  };

  // Mock script injection function
  global.chrome.scripting = {
    executeScript: ({ target, func }) => {
      return new Promise((resolve, reject) => [{result: resolve(func())}]);
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

  await waitFor(
    () => {
      expect(logSpy).toHaveBeenCalledWith(
        "Failure when setting track volume."
      );
    },
    { timeout: 1000 }
  );
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
    .mockImplementationOnce((obj, callback) =>
      callback({ status: Status.FAILURE })
    )
    .mockImplementation((obj, callback) =>
      callback({
        status: Status.SUCCESS,
        data: { track: "", artist: "" },
      })
    );

  // Mock getting spotify tab in chrome browser
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

  await waitFor(
    () => {
      expect(logSpy).toHaveBeenCalledWith(
        "Failure when setting track volume."
      );
    },
    { timeout: 1000 }
  );
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
    .mockImplementationOnce((obj, callback) =>
      callback({ status: Status.FAILURE })
    ).mockImplementation((obj, callback) => {
      callback({
        status: Status.SUCCESS,
        data: {
          artist: "",
          isPlaying: true,
          volumePercent: 24,
        },
      });
    })

  // Mock getting spotify tab in chrome browser
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

  await waitFor(() => {
    expect(logSpy).toBeCalledTimes(0);
  })
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

it("volume value greater than zero and premium user click volume button, setting volume to zero, clicks volume button, setting volume to original value", async () => {
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
    .mockImplementationOnce((obj, callback) => {
      callback({
        status: Status.SUCCESS,
      });
    })
    .mockImplementation((obj, callback) =>
      callback({
        status: Status.SUCCESS,
        data: { track: "", artist: "" },
      })
    );

  render(<SpotifyPlayer />);
  const volumeBtn = screen.getByTestId("volume-btn");
  await user.click(volumeBtn);

  const volumeSlider = screen.getByTestId("volume-slider");
  let volumeValue = volumeSlider.querySelector("input").value;
  expect(volumeValue).toBe("0");

  await user.click(volumeBtn);
  volumeValue = volumeSlider.querySelector("input").value;
  expect(volumeValue).toBe("100");
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
    .mockImplementationOnce((obj, callback) => {
      callback({
        status: Status.FAILURE,
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

  await waitFor(
    () => {
      const volumeSlider = screen.getByTestId("volume-slider");
      const volumeValue = volumeSlider.querySelector("input").value;
      expect(volumeValue).toBe("0");
    },
    { timeout: 1000 }
  );
});
});