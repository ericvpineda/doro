import React from "react";
import background from "../src/background/background";
import { chrome } from "jest-chrome";
import "@testing-library/jest-dom";
import { Status, PlayerActions } from "../src/Utils/SpotifyUtils";

// Test Points
// - PlayerActions
//  - play, pause, next, previous, save track, remove track, set volume, seek position
//  - get currently playing
//  - sign in, sign out
// - clock alarm function
// - Note: need to mock spotify API calls to prevent multiple calls to API

describe("Test background script", () => {

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

  // ----- SIGNIN TESTS -----
  test.todo(
    "user sends request to sign in with valid credientials, returns success"
  );
  test.todo(
    "user sends request to sign, chromeruntime error occurs, returns error"
  );
  test.todo(
    "user sends request to sign, spotify API returns null response, returns error"
  );
  test.todo(
    "user sends request to sign, spotify API returns response with error param, returns error"
  );
  test.todo(
    "user sends request to sign, request access token call throws error, returns error"
  );
  test.todo(
    "user sends request to sign, but user already signed in, returns error"
  );

  // ----- SIGNOUT TESTS -----
  test.todo("user sends request to sign out, chrome storage is cleared");

  // ----- GET CURRENTLY PLAYING TESTS -----  
  test.todo("user sends request to get currently playing track of type track, returns success")
  test.todo("user sends request to get currently playing track of type episode, returns success")
  test.todo("user sends request to get currently playing track of type ad, returns success")
  test.todo("user sends request to get currently playing track of unknown track type, returns error")
  test.todo("user sends request to get currently playing track, but webplayer not open in browser, returns error")
  test.todo("user sends request to get currently playing track, but spotify API returns unknown status, returns error")

  // ----- TRACK COMMAND TESTS ----- 
  test.todo("user sends request to play track, returns success")
  test.todo("user sends request to play track, but user is not spotify premium member, returns failure")
  test.todo("user sends request to play track, but spotify API returns unknown status, returns error")
  test.todo("user sends request to pause track, returns success")
  test.todo("user sends request to get next track, returns success")
  test.todo("user sends request to get previous track, returns success")
  test.todo("user sends request to save track, returns success")
  test.todo("user sends request to remove track, returns success")
  test.todo("user sends request to set volume, returns success")
  test.todo("user sends request to seek track position, returns success")

  // ----- ALARM TESTS -----
  test.todo("alarm interval is set to seconds")
  test.todo("timer is not running and user send request to start timer, does not modify timer")
  test.todo("timer counts down from 1 hours to only minutes and seconds")
  test.todo("timer counts down from 1 minute to only seconds")
  test.todo("timer is done and sends timer done notification to user")
});
