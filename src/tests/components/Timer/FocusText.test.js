import React, { createContext } from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FocusText from "../../../Components/Timer/FocusText/FocusText.tsx";
import { chrome } from "jest-chrome";
import DescriptContext from "../../../hooks/DescriptContext";

// Test Points
// - timeer is executing
//  - set user input description
// - timer idle
//  - set default description

describe("Test FocusTest component", () => {
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

  const renderProvider = (ui, providerProps) => {
    return render(
      <DescriptContext.Provider value={providerProps}>
        {ui}
      </DescriptContext.Provider>,
    );
  };

  it("not executing timer shows default description", () => {
    render(<FocusText></FocusText>);
    const descriptElem = screen.getByText(/Doro/i);

    expect(descriptElem).toBeVisible();
  });

  it("executing timer shows user input description", () => {
    chrome.storage.local.set({
      description: "Testing...",
      isExecutingRequest: true,
    });

    // useContextMock.mockReturnValue({ isShowing: true });
    const value = {
      isShowing: true,
      showDescription: jest.fn,
      hideDescription: jest.fn,
    };
    renderProvider(<FocusText />, value);
    const descriptElem = screen.getByTestId("focus-text-active");
    expect(descriptElem).toBeVisible();

    const taskText = screen.getByText("Task:")
    expect(taskText).toBeVisible();

    const descriptText = screen.getByText("Testing...");
    expect(descriptText).toBeVisible();
  });
});
