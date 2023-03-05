// Tests for Time Input Component
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Time from "../../../Components/UserInput/Time/Time.tsx";

// Tests to run
// - Check minutes and hours input validation:
//  - prevent negative and floating point values
//  - show error for large values

describe("Test hours input element", () => {
  let user, input;
  let mockHours, mockMinutes, mockErrorFxn;
  // Notes: order of function calls matter
  beforeEach(() => {
    user = userEvent.setup();
    mockHours = jest.fn();
    mockMinutes = jest.fn();
    mockErrorFxn = jest.fn();
    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    );
    input = screen.getByLabelText("Hours");
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears spy mocks
  });

  // Note: input value return type always string
  it("input valid hours value renders correct number", async () => {
    input = screen.getByLabelText("Hours");
    fireEvent.change(input, { target: { value: 23 } });
    expect(input.value).toBe("23");
  });

  it("input negative hours prevents negative sign from registering", async () => {
    input = screen.getByLabelText("Hours");
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("input floating point value prevent dot from registering", async () => {
    input = screen.getByLabelText("Hours");
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
  });

  it("input number larger than 24 shows error message", async () => {
    const message = "25";
    user.type(input, message);
    await waitFor(() => {
      expect(input).toHaveValue(+message);
      expect(mockErrorFxn).toHaveBeenCalledWith(
        "Hours must be between 0-24."
      );
    });
  });
});
  
describe("Test minutes input element", () => {
  let user, input, mockErrorFxn;
  beforeEach(() => {
    user = userEvent.setup();
    const mockHours = jest.fn();
    const mockMinutes = jest.fn();
    mockErrorFxn = jest.fn();
    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    );
    input = screen.getByLabelText("Minutes");
  });
  
  afterEach(() => {
    jest.clearAllMocks(); // Clears spy mocks
  });
  
  it("input valid minutes value renders correct number", () => {
    input = screen.getByLabelText("Minutes");
    fireEvent.change(input, { target: { value: 23 } });
    expect(input.value).toBe("23");
  });

  it("input negative minutes prevents negative sign from registering", async () => {
    input = screen.getByLabelText("Minutes");
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("input floating point value prevent dot from registering", async () => {
    input = screen.getByLabelText("Minutes");
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
  });

  it("input number larger than 59 shows error message", async () => {
    const message = "60";
    user.type(input, message);
    await waitFor(() => {
      expect(input).toHaveValue(+message);
      expect(mockErrorFxn).toHaveBeenCalledWith(
        "Minutes must be between 0-59."
      );
    });
  })
 });

describe("Test Time component hours and minutes", () => {
  let user, inputMinutes, inputHours;
  let mockErrorFxn, mockHours, mockMinutes;
  beforeEach(() => {
    user = userEvent.setup();
    mockHours = jest.fn();
    mockMinutes = jest.fn();
    mockErrorFxn = jest.fn();
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
  });

  it("user types invalid hours and minutes and shows correct error message", async () => {
    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    );
    inputMinutes = screen.getByLabelText("Minutes");
    inputHours = screen.getByLabelText("Hours");
    const message = "0";
    user.type(inputHours, message);
    user.type(inputMinutes, message);
    await waitFor(() => {
      expect(inputMinutes).toHaveValue(+message);
      expect(mockErrorFxn).toHaveBeenCalledWith(
        "Hours and minutes cannot both be 0."
      );
    });
  })

  it("user submits without with hours and minutes blank and storage is empty", async () => {
    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    );
    inputMinutes = screen.getByLabelText("Minutes");
    inputHours = screen.getByLabelText("Hours");
    expect(mockErrorFxn).toHaveBeenCalledWith( "Hours and minutes cannot both be 0.");
  })

  it("user submits without with hours and minutes blank and storage has hours and minutes saved", () => {
    const hours = "4";
    const minutes = "27";
    chrome.storage.local.set({setTime: {hours, minutes}})
    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    );
    inputMinutes = screen.getByLabelText("Minutes");
    inputHours = screen.getByLabelText("Hours");
    expect(inputHours).toHaveValue(+hours)
    expect(inputMinutes).toHaveValue(+minutes)
  })
})