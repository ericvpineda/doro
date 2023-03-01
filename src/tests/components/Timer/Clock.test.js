import React from "react";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Clock from "../../../Components/Timer/Clock/Clock.tsx";
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
// - Note: line 100 in clock.tsx not tested since uses chrome.storage.onChange.addListener

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
  });

  it("executing timer that is paused shows correct time and clock button", () => {
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

  it("executing timer shows pause btn, and clicking play button shows play btn", async () => {
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

  it("non-executing timer defaults time to zeros, clock button not shown", () => {
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

  it("executing timer with reset mode command and timer not started does not change timer state", async () => {
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

  it("executing timer with reset mode command and timer running reverts timer state", async () => {
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
    const resetBtn = screen.queryByTestId("reset-btn");

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

  it("executing timer with reset mode command and timer done, reverts timer state", async () => {
    global.chrome.storage.local.set({
        setTime: { hours: 0, minutes: 45, seconds: 0 },
        hours: 0,
        minutes: 0,
        seconds: 0,
        isRunning: false,
        isExecutingRequest: true,
      });
  
      render(<Clock></Clock>);
  
      let hours = screen.getByTestId("test-hours").textContent;
      let minutes = screen.getByTestId("test-minutes").textContent;
      let seconds = screen.getByTestId("test-seconds").textContent;
      const resetBtn = screen.queryByTestId("reset-btn");
  
      expect(hours).toBe("00");
      expect(minutes).toBe("00");
      expect(seconds).toBe("00");
  
      await user.click(resetBtn);
  
      // Note: need to reassign to get updated values
      hours = screen.getByTestId("test-hours").textContent;
      minutes = screen.getByTestId("test-minutes").textContent;
      seconds = screen.getByTestId("test-seconds").textContent;
  
      expect(hours).toBe("00");
      expect(minutes).toBe("45");
      expect(seconds).toBe("00");
  });

  it("executing time with clear mode command defaults timer values to 0 and removes clock buttons", async () => {
    global.chrome.storage.local.set({
        setTime: { hours: 0, minutes: 45, seconds: 0 },
        hours: 0,
        minutes: 0,
        seconds: 0,
        isRunning: false,
        isExecutingRequest: true,
      });
  
      render(<Clock></Clock>);
      let clearBtn = screen.queryByTestId("clear-btn")
      await user.click(clearBtn);

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
  })

  // Note: This is for end-to-end  test
  test.todo(
    "successful submit of hours and description shows clear button, reset button, and pause button"
  );
});
