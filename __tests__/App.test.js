import React from "react";
import App from "../src/App";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// App component tests
describe("Test App component", () => {
  let user, mockFxn;
  beforeEach(() => {
    user = userEvent.setup();
    mockFxn = jest.fn();

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

  // Note: Tests for basic operation of DescriptContext
  it("user inputs minutes into timer, submits request, presses clear button, returns success", async () => {
    // Prevent Time component to showing error message
    global.chrome.storage.local.set({
      hours: 0,
      minutes: 0,
      setTime: {
        hours: 1,
        minutes: 1,
      },
    });

    render(<App />);

    // Change window to timer input
    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    // User types in hours and minutes into input
    const inputHours = screen.getByLabelText("Hours");
    const inputMinutes = screen.getByLabelText("Minutes");
    const message = "1";
    user.type(inputHours, "{backspace}");
    user.type(inputHours, message);
    await waitFor(() => expect(inputHours).toHaveValue(+message));
    user.type(inputMinutes, "{backspace}");
    user.type(inputMinutes, message);
    await waitFor(() => expect(inputMinutes).toHaveValue(+message));

    // User clicks submit button (sets DescriptContext isShowing to true)
    await waitFor(() => {
      const startBtn = screen.getByText(/Start/i);
      user.click(startBtn);
    });

    // Window should automatically change to clock screen
    await waitFor(() => {
      const timerInputWindow = screen.queryByText("Set Timer");
      expect(timerInputWindow).not.toBeInTheDocument();
    });

    // Note: sets DescriptContext isShowing to false
    let clearBtn = screen.getByTestId("clear-btn");
    await user.click(clearBtn);
  });

  it("timer currently running and user opens up popup extension", () => {
    // Prevent Time component to showing error message
    global.chrome.storage.local.set({
      hours: 0,
      minutes: 0,
      seconds: 1,
      setTime: {
        hours: 1,
        minutes: 1,
      },
      isRunning: false,
      isExecutingRequest: true,
      isShowing: true,
      description: "Working...",
    });

    render(<App />);

    const topic = screen.getByText("Task:");
    const descriptText = screen.getByText("Working...");
    expect(topic).toBeVisible();
    expect(descriptText).toBeVisible();
  });

  // ----- Basic End to End tests -----

  it("user clicks settings button, shows userInput component", async () => {

    render(<App />);

    // User on clock gui page
    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    // User now on time input page
    const startBtn = screen.getByText(/Start/i);
    expect(startBtn).toBeVisible();
  });

  it("user inputs valid time and description, shows timer clock gui component", async () => {

    render(<App />);

    // User on clock gui page
    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    // User now on time input page
    const startBtn = screen.getByText(/Start/i);
    expect(startBtn).toBeVisible();

    const inputHours = screen.getByLabelText("Hours");
    const inputMinutes = screen.getByLabelText("Minutes");
    const message = "2";

    // Set valid description
    const description = "Testing description now...";
    const textBox = screen.getByRole("textbox");
    user.type(textBox, description);
    await waitFor(() => {
      expect(textBox).toHaveValue(description);
      // Set time to valid value
    });

    // Set valid hours
    user.type(inputHours, message);
    await waitFor(() => expect(inputHours).toHaveValue(+message));

    // Set valid minutes
    user.type(inputMinutes, message);
    await waitFor(() => {
      expect(inputMinutes).toHaveValue(+message);

      // User clicks start button
      user.click(startBtn);
      expect(startBtn).not.toBeVisible();
    });
  });

  it("user clicks back button in userInput component, shows clock gui page", async () => {
    
    render(<App />);

    // User on clock gui page
    const editButton = screen.getByTestId("edit-button");
    await user.click(editButton);

    // User now on time input page
    const startBtn = screen.getByText(/Start/i);
    expect(startBtn).toBeVisible();

    const returnButton = screen.getByTestId("return-button");
    expect(returnButton).toBeVisible();
    await user.click(returnButton);

    // Note: Doro logo does not show up in user input page
    const doroLogo = screen.getByText("Doro");
    expect(doroLogo).toBeVisible();
  });
});
