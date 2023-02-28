import React from 'react';
import {screen, render} from "@testing-library/react"
import '@testing-library/jest-dom'
import Clock from '../../../Components/Timer/Clock/Clock.tsx'
import { chrome } from 'jest-chrome'

// Tests
// - all time digits set to "00" 
// - saved timer in storage shows correct values

describe("Test Clock component", () => {
    
    it("defaults time to zeros, start, player toggle, reset and clear button not shown", () => {
        render(<Clock></Clock>)
        const hours = screen.getByTestId('test-hours').textContent
        const minutes = screen.getByTestId('test-minutes').textContent
        const seconds = screen.getByTestId('test-seconds').textContent
        const toggleSwitch = screen.queryByTestId('toggle-switch')
        const startBtn = screen.queryByTestId('start-btn')
        const resetBtn = screen.queryByTestId('reset-btn')
        const clearBtn = screen.queryByTestId('clear-btn')
        
        expect(hours).toBe("00")
        expect(minutes).toBe("00")
        expect(seconds).toBe("00")
        
        expect(startBtn).not.toBeInTheDocument()
        expect(toggleSwitch).not.toBeInTheDocument()
        expect(resetBtn).not.toBeInTheDocument()
        expect(clearBtn).not.toBeInTheDocument()
    })



    // Note: This is for end-to-end  test
    test.todo("successful submit of hours and description shows clear button, reset button, and pause button")
})
 