// Tests for Description Element
import Description from '../../Components/UserInput/Description'
import {render, fireEvent, screen} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'

// Tests to run 
// - Input description validation 
//  - show error if characters > 20 
//  - if no task is chosen, set default description to "Working..."

const mockFxn = jest.fn() 

describe("Test description input element", () => {

    let user; let input;
    beforeEach(() => {
        user = userEvent.setup()
        render(<Description></Description>)
        input = screen.getByLabel("Description")
    })

    
})
