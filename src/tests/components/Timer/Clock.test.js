import {fireEvent, screen, render} from "@testing-library/react"
import '@testing-library/jest-dom'
import Clock from '../../../Components/Timer/Clock/Clock.tsx'

// Tests
// - click clock gui does not update button text to pause
// - all time digits set to "00" 

describe("Test Clock component", () => {

    let startBtn;
    beforeEach(() => {
        global.chrome = {
            storage: {
                local: {
                    set: jest.fn(),
                    get: jest.fn()
                },
                onChanged: {
                    addListener: jest.fn()
                }
            }
        }
        render(<Clock></Clock>)
        startBtn = screen.getByText('Start')
    })

    it("default time to zeros and start button shown", () => {
        const hours = screen.getByTestId('test-hours').textContent
        const minutes = screen.getByTestId('test-minutes').textContent
        const seconds = screen.getByTestId('test-seconds').textContent
        
        expect(hours).toBe("00")
        expect(minutes).toBe("00")
        expect(seconds).toBe("00")

        expect(startBtn).toBeVisible()
    })

    it("clicking clock gui does not change start button text", () => {
        fireEvent.click(startBtn)
        
        const startBtnText = screen.getByText('Start');
        expect(startBtnText).toBeVisible()
    })
})
 