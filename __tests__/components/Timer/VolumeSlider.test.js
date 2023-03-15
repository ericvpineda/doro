import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import VolumeSlider from "../../../src/Components/Timer/SpotifyPlayer/VolumeSlider/VolumeSlider";
import { chrome } from "jest-chrome";
import userEvent from "@testing-library/user-event";

describe("VolumeSlider component", () => {
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
    document.body.innerHTML = "";
  });

  it("user changes volume, sets correct volume", async () => {
    const mockTrackVolumeChange = jest.fn();

    render(
      <VolumeSlider
        setShowVolumeTrack={jest.fn()}
        trackVolumeChangeCommitted={mockTrackVolumeChange}
        volume={100}
        isMounted={true}
      />
    );

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

    expect(mockTrackVolumeChange).toHaveBeenCalledWith(0);
  });
});
