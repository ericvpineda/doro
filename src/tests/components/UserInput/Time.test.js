// Tests for Time Input Component
import React from 'react';
import { render, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'
import Time from "../../../Components/UserInput/Time/Time.tsx";

// Tests to run
// - Check minutes and hours input validation:
//  - prevent negative and floating point values 
//  - show error for large values

const mockFxn = jest.fn();

describe("Test hours input element", () => {
    
    let user, input, startBtn;
    // Notes: order of function calls matter
    beforeEach(() => {  
        user = userEvent.setup()
        render(<Time setHours={mockFxn} setMinutes={mockFxn}/>);
        input = screen.getByLabelText("Hours");
        // startBtn = screen.getByText("Start");
    })
  // Note: input value return type always string
  test.todo("input valid hours value renders correct number")
    // fireEvent.change(input, { target: { value: 23 } });
    // expect(input.value).toBe("23");
  // });

  test.todo("input negative hours prevents negative sign from registering")
    // await user.type(input, "-1");
    // expect(input.value).toBe("1");
  // });

  test.todo("input floating point value prevent dot from registering")
    // await user.type(input, "2.3");
    // expect(input.value).toBe("23");
  // });

  test.todo("input number larger 24 shows error message")
    // await user.type(input, "25")
    // fireEvent.focusOut(input)
    // const errorComp = screen.getByText(/Must be between 0 to 24./i)
    // expect(errorComp).toBeVisible()
  // })
});

describe("Test minutes input element", () => {
  
  let user; let input;
  beforeEach(() => {
    user = userEvent.setup()
    render(<Time setMinutes={mockFxn} setHours={mockFxn}></Time>)
    input = screen.getByLabelText("Minutes");
  })

  test.todo("input valid minutes value renders correct number")
    // fireEvent.change(input, { target: { value: 23 }})
    // expect(input.value).toBe("23")
  // })  

  test.todo("input negative minutes prevents negative sign from registering")
    // await user.type(input, "-1");
    // expect(input.value).toBe("1");
  // });

  test.todo("input floating point value prevent dot from registering")
    // await user.type(input, "2.3");
    // expect(input.value).toBe("23");
  // });

  test.todo("input number larger than 59 shows error message")
    // await user.type(input, "60")
    // await user.click(startBtn)
    // const errorComp = screen.getByText(/Must be between 0 to 59./i)
    // expect(errorComp).toBeVisible()
  // })
})



