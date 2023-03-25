import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Time from "../../../src/Components/UserInput/Time/Time.tsx";

// Tests to run
// - Check minutes and hours input validation:
//  - prevent negative and floating point values
//  - show error for large values
// - Note: 
//  - unable to test for setMinutesHandler, setHoursHandler change event when user clears output

// Tests for Time Input Component
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
  it("user input valid hours value, renders correct number", async () => {
    input = screen.getByLabelText("Hours");
    await user.type(input, "23");
    expect(input.value).toBe("23");
  });

  it("user input negative hours, prevents negative sign from registering", async () => {
    input = screen.getByLabelText("Hours");
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("user input floating point value, prevents dot from registering", async () => {
    input = screen.getByLabelText("Hours");
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
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
  
  it("user input valid minutes value, renders correct number", async () => {
    input = screen.getByLabelText("Minutes");
    await user.type(input, "23");
    expect(input.value).toBe("23");
  });

  it("user input negative minutes, prevents negative sign from registering", async () => {
    input = screen.getByLabelText("Minutes");
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("user input floating point value, prevents dot from registering", async () => {
    input = screen.getByLabelText("Minutes");
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
  });
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

  it("user types 10 minutes, then clears hours, returns success", async () => {
    chrome.storage.local.set({
      hours: 1,
      minutes: 2,
      setTime: {
        hours: 1,
        minutes: 3
      }
    })

    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    )

    inputHours = screen.getByLabelText("Hours");
    inputMinutes = screen.getByLabelText("Minutes");

    // Note: will have pre-entered values (from chrome storage)
    user.type(inputMinutes, "{backspace}");
    await waitFor(() => {
      expect(inputMinutes).toHaveValue(null)
      expect(mockErrorFxn).toHaveBeenCalledWith("");
    });
    
    user.type(inputHours, "0");
    await waitFor(() => {
      expect(inputHours).toHaveValue(10)
    });
  })

  it("user types 0 hours, then 0 minutes, shows correct error message", async () => {
    chrome.storage.local.set({
      hours: 1,
      minutes: 2,
      setTime: {
        hours: 1,
        minutes: 3
      }
    })

    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    )

    inputHours = screen.getByLabelText("Hours");
    inputMinutes = screen.getByLabelText("Minutes");

    // Note: will have pre-entered values (from chrome storage)
    user.type(inputMinutes, "{backspace}");
    user.type(inputMinutes, "0");
    await waitFor(() => {
      expect(inputMinutes).toHaveValue(0)
      expect(mockErrorFxn).toHaveBeenCalledWith("");
    });
    
    user.type(inputHours, "{backspace}");
    user.type(inputHours, "0");
    await waitFor(() => {
      expect(inputHours).toHaveValue(0)
      expect(mockErrorFxn).toHaveBeenCalledWith(
        "Hours and minutes cannot both be 0."
      );
    });
  })

  it("user types 0 minutes, then 0 hours, shows correct error message", async () => {
    chrome.storage.local.set({
      hours: 1,
      minutes: 2,
      setTime: {
        hours: 1,
        minutes: 3
      }
    })

    render(
      <Time
        setErrorMessage={mockErrorFxn}
        setHours={mockHours}
        setMinutes={mockMinutes}
      />
    )

    inputHours = screen.getByLabelText("Hours");
    inputMinutes = screen.getByLabelText("Minutes");

    // Note: will have pre-entered values (from chrome storage)
    user.type(inputHours, "{backspace}");
    user.type(inputHours, "0");
    await waitFor(() => {
      expect(inputHours).toHaveValue(0)
      expect(mockErrorFxn).toHaveBeenCalledWith("");
    });
    
    user.type(inputMinutes, "{backspace}");
    user.type(inputMinutes, "0");
    await waitFor(() => {
      expect(inputMinutes).toHaveValue(0)
      expect(mockErrorFxn).toHaveBeenCalledWith(
        "Hours and minutes cannot both be 0."
      );
    });
  })

  it("user submits without with hours and minutes blank, storage is empty", async () => {
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

  it("user submits without with hours and minutes blank, storage has hours and minutes saved", () => {
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