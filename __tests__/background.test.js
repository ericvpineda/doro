import { waitFor } from "@testing-library/react";
import { ChromeData } from "../src/Utils/ChromeUtils";
import "@testing-library/jest-dom";

// Test Points
// - clock alarm function

describe("Test background script", () => {

  const backgroundScriptPath = "../src/background/background";

  beforeEach(() => {

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
    jest.resetModules(); // Reset module imports
    jest.clearAllMocks();
  });

  
  // ----- ALARM TESTS -----
  it("alarm interval is set to seconds", () => {

    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {addListener: jest.fn()}
    }

    // Dynamic import of background script
    require(backgroundScriptPath)
    expect(global.chrome.alarms.create).toBeCalledWith({periodInMinutes: 1 / 60})
  });

  it("timer is not running and user send request to start timer, does not modify timer", async () => {

    // Stub chrome storage for timer values
    const isRunning = false;
    const hours = 5;
    const minutes = 30;
    const seconds = 23;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => {
          callback("test-alarm")
        }
      }
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check if chrome storage was modified
    await waitFor(() => {
      expect(result.hours).toBe(hours)
      expect(result.minutes).toBe(minutes)
      expect(result.seconds).toBe(seconds)
      expect(result.isRunning).toBe(isRunning)
    })
  });

  it("timer counts down from 1 hours to only minutes and seconds", async () => {
    
    // Stub chrome storage to have pre-set time values
    const isRunning = true;
    const hours = 1;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome storage if values were decremented
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(59)
      expect(result.seconds).toBe(59)
      expect(result.isRunning).toBe(isRunning)
    })
  });
    
  it("timer counts down from 1 minute to only seconds", async () => {

    // Stub chrome storage
    const isRunning = true;
    const hours = 0;
    const minutes = 1;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome storage if values were decremented
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(59)
      expect(result.isRunning).toBe(isRunning)
    })
  });
  
  it("timer counts down from 55 second value", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 55;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Dynamic import background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome storage if values were decremented
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(54)
      expect(result.isRunning).toBe(isRunning)
    })
  });

  it("1 hour timer is done, timer sends notification to user", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours: 1,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Mock chrome notifications 
    global.chrome.notifications = {
      create: jest.fn()
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome notifications was called
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.isRunning).toBe(false)
      expect(global.chrome.notifications.create).toHaveBeenCalledWith({
        title: "Doro - Pomodoro with Spotify Player",
          message: "1 hour(s) timer complete.",
          type: "basic",
          iconUrl: "./img/doro_logo.png",
      })
    })
  });
  
  it("1 hour 1 minute timer is done, timer sends notification to user", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours: 1,
        minutes: 1
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Mock chrome notification
    global.chrome.notifications = {
      create: jest.fn()
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome notifications was called upon
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.isRunning).toBe(false)
      expect(global.chrome.notifications.create).toHaveBeenCalledWith({
        title: "Doro - Pomodoro with Spotify Player",
          message: "1 hour(s) and 1 minute(s) timer complete.",
          type: "basic",
          iconUrl: "./img/doro_logo.png",
      })
    })
  });
 
  it("1 minute timer is done, timer sends notification to user", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes: 1
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Mock chrome notifications
    global.chrome.notifications = {
      create: jest.fn()
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check if chrome notifications was called upon
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.isRunning).toBe(false)
      expect(global.chrome.notifications.create).toHaveBeenCalledWith({
        title: "Doro - Pomodoro with Spotify Player",
          message: "1 minute(s) timer complete.",
          type: "basic",
          iconUrl: "./img/doro_logo.png",
      })
    })
  });

});
