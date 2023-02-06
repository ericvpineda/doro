import React, {userEvent, render, screen} from 'react'
import '@testing-library/jest-dom'
import App from './App.tsx'

// Note
// - Test integration of components here

describe("Test App component", () => {
    
    beforeEach(() => {
        render(render(<App></App>))    
    }) 

    test.todo("valid time input shows timer clock gui component")
    test.todo("clicking settings button changes page to userInput")
    test.todo("click back button in userInput changes page to clock gui page")
    test.todo("input valid description shows in clock gui page")
})

