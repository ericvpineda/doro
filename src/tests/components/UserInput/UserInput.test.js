import * as React from 'react'
import {fireEvent, screen, render} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'
import UserInput from "../../../Components/UserInput/UserInput/UserInput.tsx"

// Areas of test
// - valid hours and minutes and start button pushed 
// - no hours or minutes input and start button pushed


describe("Test UserInput component", () => {

    let startBtn; let user; let mockFxn; 
    beforeEach(() => {
        user = userEvent.setup()
        mockFxn = jest.fn() 
        
        // Stub chrome api
        global.chrome = {
            storage: {
                data: {hours: -1, minutes: -1},
                local: {
                    set: null,
                    get: jest.fn()
                }
            }
        }
        global.chrome.storage.local["set"] = (inputs) => {
            for(const [key, value] of Object.entries(inputs)) {
                chrome.storage.data[key] = value
            }
        }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })


    it("hours and minutes input empty, show error message", () => {
        // render(<UserInput setShowTimerHandler={mockFxn}></UserInput>)
        // startBtn = screen.getByText(/Start/i)
        // user.click(startBtn)

        // // Check error message
        // const errorElem = screen.getByText(/Hours and minutes cannot both be 0./i)
        // expect(errorElem).toBeVisible()

        // // Check if chrome storage not tampered with
        // expect(chrome.storage.data["hours"]).toBe(-1)
        // expect(chrome.storage.data["minutes"]).toBe(-1)

    })

    it("hours and minutes input empty, sets error state to false", () => {
        
      // Check value of error state function
    //   let setError = jest.fn()
    //   jest.spyOn(React, 'useState').mockImplementation(x => [x, setError])
    //   render(<UserInput setShowTimerHandler={mockFxn}></UserInput>)
    //   startBtn = screen.getByText(/Start/i)
    //   fireEvent.click(startBtn)

    //   expect(setError).toBeCalledWith(true)
    })

})