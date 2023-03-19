import React from "react";
import { waitFor, act } from "@testing-library/react";
// import { chrome } from "jest-chrome";
import { PlayerActions, Status } from "../src/Utils/SpotifyUtils";
import { ChromeData } from "../src/Utils/ChromeUtils";
import { generateChallenge, random } from "../src/Utils/AuthUtils";
import "@testing-library/jest-dom";

// Test Points
// - PlayerActions
//  - play, pause, next, previous, save track, remove track, set volume, seek position
//  - get currently playing
//  - sign in, sign out
// - clock alarm function
// - Note:
//  - need to mock spotify API calls to prevent multiple calls to API
//  - unable to get correct jest mock calls in Proimise then() statements 
//   - solution: break up mock for chrome listener and user command

describe("Test background script", () => {
  let mockFxn, logSpy;
  beforeEach(() => {
    mockFxn = jest.fn();
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

    // Mock setInterval
    // jest.useFakeTimers();
    // jest.spyOn(global, "setInterval");
  });

  afterEach(() => {
    // jest.runOnlyPendingTimers()
    // jest.useRealTimers();
    jest.resetModules(); // Reset module imports
    jest.clearAllMocks();
  });

  // ----- SIGNIN TESTS -----
  it("user sends request to sign in with valid credientials, chrome listener receives correct player action", async () => {
    const mockRes = jest.fn()
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow = jest.fn();

    // Dynamic import of background script
    require("../src/background/background");

    await waitFor(() => {
      expect(chrome.identity.launchWebAuthFlow).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to sign in with valid credientials, returns success", async () => {
    const mockRes = jest.fn()
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Mock fetch request to Spotify API
    global.fetch = jest.fn(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            json: () =>
              new Promise((resolve, reject) =>
                resolve({
                  refresh_token:
                    "s4apH8Z4yj4NFazCzYU6dhKxXZTUnxEq6BKHmAwACPREAzAnKk", // Fake token
                  expires_in: 3600, // Default as in spotify documentation
                  access_token:
                    "btu6egGeVdQM8nEANiDdDtCc7f68bzAHwiCntsVeJJdMPHqqqB", // Fake token
                })
              ),
          })
        )
    );

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.SUCCESS, "error": ""})
  });

  it("user sends request to sign, chrome runtime error occurs, returns error", async () => {
    // Stub user request to signin
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };
    
    // Mock launchWebAuthFlow when user signs in  
    const mockRes = jest.fn()
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub Chrome runtime error when user calls launchWebAuthFlow
    const message = "User did not approve access."
    global.chrome.runtime.lastError = { message }

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow functionality
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.ERROR, "error": { message }})

    // Used to set chrome runtime lastError as undefined
    delete global.chrome.runtime.lastError;
  });

  it("user sends request to sign, spotify API returns null response, returns error", async () => {
    // Stub user request to signin
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };
    
    // Mock launchWebAuthFlow functionality 
    const mockRes = jest.fn()
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = null;

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.ERROR, "error": {
      message: "User access denied."
    }})
  });

  it("user sends request to sign, spotify API returns response with error param, returns error", async () => {
    // Stub user request to sign in 
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };
    
    // Mock chrome addlistener call
    const mockRes = jest.fn()
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "error",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.ERROR, "error": {
      message: "User access denied."
    }})
  });

  it("user sends request to sign, spotify API returns response with non-matching state param, returns error", async () => {
    // Stub user request to sign in 
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };
    
    // Mock chrome addlistener call
    const mockRes = jest.fn()
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "error",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", "non-matching state");

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.ERROR, "error": {
      message: "User access denied."
    }})
  });

  it("user sends request to sign, requesting access token call throws error, returns error", async () => {
    // Stub user sign in
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };
    
    // Mock user addlistener functionality 
    const mockRes = jest.fn()
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Mock fetch request to Spotify API
    const message = "Error fetching Spotify API";
    global.fetch = jest.fn(
      (url, obj) =>
        new Promise((resolve, reject) =>
          reject({message})
        )
    );

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.ERROR, "error": {
      message
    }})
  });

  it("user sends request to sign, but user already signed in, returns error", async () => {
    // Stub user request
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
      signedIn: true
    };
    
    // Mock addListener functionality 
    const mockRes = jest.fn()
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    const signIn = require("../src/background/background").signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({"status": Status.FAILURE, "error": {
      message: "User already logged in."
    }})
  });

  // ----- SIGNOUT TESTS -----
  it("user sends request to sign out, chrome storage is cleared", async () => {
    global.chrome.storage.local.set({
      signedIn: true,
    });

    const mockRes = jest.fn();
    const stubReq = {
      message: PlayerActions.SIGNOUT,
    };

    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    let result;

    // Dynamic import of background script
    await require("../src/background/background");

    // Get result values from chrome storage
    chrome.storage.local.get(
      [
        ChromeData.signedIn,
        ChromeData.refreshToken,
        ChromeData.expiresIn,
        ChromeData.accessToken,
        ChromeData.endTime,
      ],
      (res) => {
        result = {
          signedIn: res.signedIn,
          refreshToken: res.refreshToken,
          expiresIn: res.expiresIn,
          accessToken: res.accessToken,
          endTime: res.endTime,
        };
      }
    );

    // Wait for async get() call from chrome storage
    await waitFor(() => {
      expect(result.signedIn).toBe(false);
      expect(result.refreshToken).toBe("");
      expect(result.expiresIn).toBe("");
      expect(result.accessToken).toBe("");
      expect(result.endTime).toBe("");
    });
  });

  // ----- GET CURRENTLY PLAYING TESTS -----
  test.todo(
    "user sends request to get currently playing track of type track, returns success"
  );
  test.todo(
    "user sends request to get currently playing track of type episode, returns success"
  );
  test.todo(
    "user sends request to get currently playing track of type ad, returns success"
  );
  test.todo(
    "user sends request to get currently playing track of unknown track type, returns error"
  );
  test.todo(
    "user sends request to get currently playing track, but webplayer not open in browser, returns error"
  );
  test.todo(
    "user sends request to get currently playing track, but spotify API returns unknown status, returns error"
  );

  // ----- TRACK COMMAND TESTS -----
  test.todo("user sends request to play track, returns success");
  test.todo(
    "user sends request to play track, but user is not spotify premium member, returns failure"
  );
  test.todo(
    "user sends request to play track, but spotify API returns unknown status, returns error"
  );
  test.todo("user sends request to pause track, returns success");
  test.todo("user sends request to get next track, returns success");
  test.todo("user sends request to get previous track, returns success");
  test.todo("user sends request to save track, returns success");
  test.todo("user sends request to remove track, returns success");
  test.todo("user sends request to set volume, returns success");
  test.todo("user sends request to seek track position, returns success");

  // ----- ALARM TESTS -----
  test.todo("alarm interval is set to seconds");
  test.todo(
    "timer is not running and user send request to start timer, does not modify timer"
  );
  test.todo("timer counts down from 1 hours to only minutes and seconds");
  test.todo("timer counts down from 1 minute to only seconds");
  test.todo("timer is done and sends timer done notification to user");
});
