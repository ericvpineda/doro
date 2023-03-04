import React from "react";
import Description from "../../../Components/UserInput/Description/Description.tsx";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Tests points
// - Input description validation
//  - show error if characters > 30 characters
//  - no task descriptio default description to "Working..."

// Tests for Description Element
describe("Test description input element", () => {
  let user, input, mockErrorFxn, mockDescriptionFxn, defaultMsg, description;
  beforeEach(() => {
    user = userEvent.setup();
    mockDescriptionFxn = jest.fn();
    mockErrorFxn = jest.fn();
    defaultMsg = "Working...";
    description = "Test";
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
    jest.clearAllMocks();
  });

  it("input valid description renders on screen", async () => {
    render(
      <Description
        description={description}
        defaultMsg={defaultMsg}
        setDescription={mockDescriptionFxn}
        setErrorMessage={mockErrorFxn}
      ></Description>
    );
    input = screen.getByLabelText(/Focus Plan?/i);
    fireEvent.change(input, { target: { value: "Working on doro extension" } });
    expect(input.value).toBe("Working on doro extension");
  });

  it("input description with greater than 30 characters shows error message", async () => {
    render(
      <Description
        description={description}
        defaultMsg={defaultMsg}
        setDescription={mockDescriptionFxn}
        setErrorMessage={mockErrorFxn}
      ></Description>
    );
    const message = "This message is way over the limit...";
    const textBox = screen.getByRole("textbox");
    user.type(textBox, message);
    await waitFor(() => {
      expect(textBox).toHaveValue(message);
      expect(mockDescriptionFxn).toHaveBeenCalledTimes(0);
      expect(mockErrorFxn).toHaveBeenCalledWith(
        "Focus plan character limit is 0-30."
      );
    });
  });

  it("input description does not error, correct parent props set", async () => {
    render(
      <Description
        description={description}
        defaultMsg={defaultMsg}
        setDescription={mockDescriptionFxn}
        setErrorMessage={mockErrorFxn}
      ></Description>
    );
    const message = "Testing description...";
    const textBox = screen.getByRole("textbox");
    user.type(textBox, message);
    await waitFor(() => {
      expect(textBox).toHaveValue(message);
      expect(mockErrorFxn).toHaveBeenCalledWith("");
      expect(mockDescriptionFxn).toHaveBeenCalledTimes(1);
    });
  });

  it("storage cached description shows as input value placeholder", async () => {
    chrome.storage.local.set({ description });
    render(
      <Description
        description={description}
        defaultMsg={defaultMsg}
        setDescription={mockDescriptionFxn}
        setErrorMessage={mockErrorFxn}
      ></Description>
    );
    input = screen.getByLabelText(/Focus Plan?/i);
    expect(input).toHaveValue(description);
  });
});
