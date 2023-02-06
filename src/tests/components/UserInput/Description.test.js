// Tests for Description Element
import Description from '../../../Components/UserInput/Description/Description.tsx'
import {render, fireEvent, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'

// Tests to run 
// - Input description validation 
//  - show error if characters > 20 
//  - if no task description, allow empty string
//      - in UserInput, handle set default description to "Simply working..."
// - note
//  - need to prevent re-sizing of description input 
//  - fix error: value of hours and minutes == 0, conic handle issue

const mockFxn = jest.fn() 

describe("Test description input element", () => {

    let user; let input;
    beforeEach(() => { 
        user = userEvent.setup()
        render(<Description setDescript={mockFxn }></Description>)
        input = screen.getByLabelText(/Focus Plan?/i)
    })

    it("input valid description renders on screen", () => {
        fireEvent.change(input, {target: {value: "Working on doro extension"}})
        expect(input.value).toBe("Working on doro extension")
    })

    it("input description with greater than 30 characters shows error message", async () => {
        await user.type(input, "This message is over the limit.")
        fireEvent.focusOut(input)
        const errorComp = screen.getByText(/Character limit 0 to 30./i)
        expect(errorComp).toBeVisible()
    })

    it("input description is empty, input value is empty", async () => {
        fireEvent.change(input, {target: {value: ""}})
        expect(input.value).toBe("")
    })
})
