import React from "react";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Clock from "../../../src/Components/Timer/Clock/Clock.tsx";
import userEvent from "@testing-library/user-event";
import { chrome } from "jest-chrome";

// Tests
// - Timer conditions:
//  - Currently executing
//      - paused mode (shows play button) -- d
//      - play mode (show pause button) -- d
//          - clicking button switches to pause button
//      - reset mode (timer unchanged, running, complete) -- d
//      - clear mode -- d
//  - Not executing
//      - no input in storage -- d
//      - has input in storage & shows correct values, shows buttons -- d

describe("Test Clock component", () => {
  let user;
  beforeEach(() => {
    // Create userEvent object
    user = userEvent.setup();

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
    global.chrome.storage.onChanged = {
      addListener: (func) => func(),
    };
  });

  it("timer (executing, non-running) that is paused, shows correct time and clock buttons", () => {
    global.chrome.storage.local.set({
      setTime: { hours: 1, minutes: 1, seconds: 0 },
      hours: 1,
      minutes: 1,
      seconds: 12,
      isRunning: false,
      isExecutingRequest: true,
    });

    render(<Clock></Clock>);
    const playBtn = screen.queryByTestId("play-btn");
    const resetBtn = screen.queryByTestId("reset-btn");
    const clearBtn = screen.queryByTestId("clear-btn");
    const hours = screen.getByTestId("test-hours").textContent;
    const minutes = screen.getByTestId("test-minutes").textContent;
    const seconds = screen.getByTestId("test-seconds").textContent;
    const pauseBtn = screen.queryByTestId("pause-btn");

    expect(playBtn).toBeInTheDocument();
    expect(resetBtn).toBeInTheDocument();
    expect(clearBtn).toBeInTheDocument();
    expect(pauseBtn).not.toBeInTheDocument();

    expect(hours).toBe("01");
    expect(minutes).toBe("01");
    expect(seconds).toBe("12");
  });

  it("user clicks play button on timer (executing, non-running) that is currently paused, shows play button", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 1, minutes: 1, seconds: 0 },
      hours: 1,
      minutes: 1,
      seconds: 12,
      isRunning: true,
      isExecutingRequest: true,
    });

    render(<Clock></Clock>);
    let pauseBtn = screen.queryByTestId("pause-btn");
    let playBtn = screen.queryByTestId("play-btn");
    expect(pauseBtn).toBeInTheDocument();
    expect(playBtn).not.toBeInTheDocument();

    await user.click(pauseBtn);
    pauseBtn = screen.queryByTestId("pause-btn");
    playBtn = screen.queryByTestId("play-btn");

    expect(pauseBtn).not.toBeInTheDocument();
    expect(playBtn).toBeInTheDocument();
  });

  it("timer (non-executing) defaults time to zeros, clock button not shown", () => {
    render(<Clock></Clock>);
    const hours = screen.getByTestId("test-hours").textContent;
    const minutes = screen.getByTestId("test-minutes").textContent;
    const seconds = screen.getByTestId("test-seconds").textContent;
    const playBtn = screen.queryByTestId("play-btn");
    const pauseBtn = screen.queryByTestId("pause-btn");
    const resetBtn = screen.queryByTestId("reset-btn");
    const clearBtn = screen.queryByTestId("clear-btn");

    expect(hours).toBe("00");
    expect(minutes).toBe("00");
    expect(seconds).toBe("00");

    expect(playBtn).not.toBeInTheDocument();
    expect(resetBtn).not.toBeInTheDocument();
    expect(clearBtn).not.toBeInTheDocument();
    expect(pauseBtn).not.toBeInTheDocument();
  });

  it("user click reset button on timer (executing, non-running) that has not started, does not change timer state", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 0, minutes: 45, seconds: 0 },
      hours: 0,
      minutes: 45,
      seconds: 0,
      isRunning: false,
      isExecutingRequest: true,
    });

    render(<Clock></Clock>);

    const hours = screen.getByTestId("test-hours").textContent;
    const minutes = screen.getByTestId("test-minutes").textContent;
    const seconds = screen.getByTestId("test-seconds").textContent;
    const resetBtn = screen.queryByTestId("reset-btn");

    expect(hours).toBe("00");
    expect(minutes).toBe("45");
    expect(seconds).toBe("00");

    await user.click(resetBtn);

    expect(hours).toBe("00");
    expect(minutes).toBe("45");
    expect(seconds).toBe("00");
  });

  it("user clicks reset button on timer (executing, running), reverts timer state", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 0, minutes: 45, seconds: 0 },
      hours: 0,
      minutes: 23,
      seconds: 23,
      isRunning: false,
      isExecutingRequest: true,
    });

    render(<Clock></Clock>);

    let hours = screen.getByTestId("test-hours").textContent;
    let minutes = screen.getByTestId("test-minutes").textContent;
    let seconds = screen.getByTestId("test-seconds").textContent;
    const resetBtn = screen.getByTestId("reset-btn");

    expect(hours).toBe("00");
    expect(minutes).toBe("23");
    expect(seconds).toBe("23");

    await user.click(resetBtn);

    // Shows current html
    // screen.debug();

    // Note: need to reassign to get updated values
    hours = screen.getByTestId("test-hours").textContent;
    minutes = screen.getByTestId("test-minutes").textContent;
    seconds = screen.getByTestId("test-seconds").textContent;

    expect(hours).toBe("00");
    expect(minutes).toBe("45");
    expect(seconds).toBe("00");
  });

  it("user click reset button on timer (executing, non-running) that has already started, reverts timer state", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 1, minutes: 45, seconds: 0 },
      hours: 0,
      minutes: 0,
      seconds: 1,
      isRunning: false,
      isExecutingRequest: true,
    });

    render(<Clock></Clock>);

    let hours = screen.getByTestId("test-hours").textContent;
    let minutes = screen.getByTestId("test-minutes").textContent;
    let seconds = screen.getByTestId("test-seconds").textContent;
    const resetBtn = screen.getByTestId("reset-btn");

    expect(hours).toBe("00");
    expect(minutes).toBe("00");
    expect(seconds).toBe("01");

    await user.click(resetBtn);

    // Note: need to reassign to get updated values
    hours = screen.getByTestId("test-hours").textContent;
    minutes = screen.getByTestId("test-minutes").textContent;
    seconds = screen.getByTestId("test-seconds").textContent;

    expect(hours).toBe("01");
    expect(minutes).toBe("45");
    expect(seconds).toBe("00");
  });

  it("user clicks clear button on timer (executing, non-running) that has already started, defaults timer values to 0 and removes clock buttons", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 0, minutes: 45, seconds: 0 },
      hours: 0,
      minutes: 0,
      seconds: 10,
      isRunning: false,
      isExecutingRequest: true,
    });

    render(<Clock></Clock>);
    let clearBtn = screen.getByTestId("clear-btn");
    await user.click(clearBtn);

    // screen.debug();

    const hours = screen.getByTestId("test-hours").textContent;
    const minutes = screen.getByTestId("test-minutes").textContent;
    const seconds = screen.getByTestId("test-seconds").textContent;
    const playBtn = screen.queryByTestId("play-btn");
    const pauseBtn = screen.queryByTestId("pause-btn");
    const resetBtn = screen.queryByTestId("reset-btn");
    clearBtn = screen.queryByTestId("clear-btn");

    expect(hours).toBe("00");
    expect(minutes).toBe("00");
    expect(seconds).toBe("00");

    expect(playBtn).not.toBeInTheDocument();
    expect(resetBtn).not.toBeInTheDocument();
    expect(clearBtn).not.toBeInTheDocument();
    expect(pauseBtn).not.toBeInTheDocument();
  });

  it("user clicks clock gui on timer (executing, non-running) that is paused, timer starts to run", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 12, minutes: 45, seconds: 0 },
      hours: 10,
      minutes: 0,
      seconds: 10,
      isRunning: false,
      isExecutingRequest: true,
    });

    chrome.storage.local.set({ isRunning: false });

    render(<Clock></Clock>);
    let clockGUI = screen.getByTestId("timer-ring");
    await user.click(clockGUI);

    let isRunning;
    await chrome.storage.local.get(["isRunning"], (res) => {
      isRunning = res.isRunning;
    })

    expect(isRunning).toBe(true);
  });

  // Note: branch conditional setIsRunningHandler
  it("user clicks clock gui on timer (non-executing, non-running) that is paused, timer does nothing", async () => {
    global.chrome.storage.local.set({
      setTime: { hours: 12, minutes: 45, seconds: 0 },
      hours: 10,
      minutes: 0,
      seconds: 10,
      isRunning: false,
      isExecutingRequest: false,
    });

    chrome.storage.local.set({ isRunning: false });

    render(<Clock></Clock>);
    let clockGUI = screen.getByTestId("timer-ring");
    await user.click(clockGUI);

    let isRunning;
    await chrome.storage.local.get(["isRunning"], (res) => {
      isRunning = res.isRunning;
    })

    expect(isRunning).toBe(false);
  });

  // Note: This is for E2E test
  test.todo(
    "successful submit of hours and description shows clear button, reset button, and pause button"
  );
});
