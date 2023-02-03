// Tests for Time Input Component
import { render, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'
import Time from "../../Components/UserInput/Time/Time";

// Tests to run
// - Check minutes and hours input validation:
//  - prevent negative and floating point values 
//  - show error for large values

const mockFxn = jest.fn();

describe("Test hours input element", () => {
    
    let user; let input;
    // Notes: order of function calls matter
    beforeEach(() => {  
        user = userEvent.setup()
        render(<Time setHours={mockFxn} setMinutes={mockFxn}/>);
        input = screen.getByLabelText("Hours");
    })
  // Note: input value return type always string
  it("input valid hours value renders correct number", () => {
    fireEvent.change(input, { target: { value: 23 } });
    expect(input.value).toBe("23");
  });

  it("input negative hours prevents negative sign from registering", async () => {
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("input floating point value prevent dot from registering", async () => {
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
  });

  it("input number larger 24 shows error message", async () => {
    await user.type(input, "25")
    const errorComp = screen.getByText(/Must be between 0 to 24./i)
    expect(errorComp).toBeVisible()
  })
});

describe("Test minutes input element", () => {
  
  let user; let input;
  beforeEach(() => {
    user = userEvent.setup()
    render(<Time setMinutes={mockFxn} setHours={mockFxn}></Time>)
    input = screen.getByLabelText("Minutes");
  })

  it("input valid minutes value renders correct number", () => {
    fireEvent.change(input, { target: { value: 23 }})
    expect(input.value).toBe("23")
  })  

  it("input negative minutes prevents negative sign from registering", async () => {
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("input floating point value prevent dot from registering", async () => {
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
  });

  it("input number larger than 59 shows error message", async () => {
    await user.type(input, "60")
    const errorComp = screen.getByText(/Must be between 0 to 59./i)
    expect(errorComp).toBeVisible()
  })
})



