import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import VolumeSlider from "../../../src/Components/Timer/SpotifyPlayer/VolumeSlider/VolumeSlider";
import { chrome } from "jest-chrome";
import { Status } from "../../../src/Utils/SpotifyUtils";
import userEvent from "@testing-library/user-event";

describe("VolumeSlider component", () => {
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

  test.todo("")
  
});
