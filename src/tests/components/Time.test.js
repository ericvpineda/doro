// Tests for Time Input Component
import { render, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event"

import Time from "../../Components/UserInput/Time/Time";

// Tests to run
// - Cannot input negative time, hours > 24, min > 59

describe("When user selects hours input element", () => {
  // Note:
  // - input value return type always tring
  it("input valid hours value renders correct number", () => {
    const timeComp = render(<Time setHours={() => {}} />);
    const input = timeComp.getByLabelText("Hours");
    fireEvent.change(input, { target: { value: 23 } });
    expect(input.value).toBe("23");
  });

  it("input negative hours shows error description", async () => {
    const user = userEvent.setup()
    const timeComp = render(<Time setHours={() => {}} />);
    const input = timeComp.getByLabelText("Hours");
    await user.type(input, "-1");
    expect(input.value).toBe("1");
  });

  it("input floating point value shows error description", async () => {
    const user = userEvent.setup()
    const timeComp = render(<Time setHours={() => {}} />);
    const input = timeComp.getByLabelText("Minutes");
    await user.type(input, "2.3");
    expect(input.value).toBe("23");
  });
});
