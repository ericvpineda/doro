import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom'
import FocusText from '../../../Components/Timer/FocusText/FocusText.tsx'

// Test
// - task desription default to empty

describe("Test FocusTest component", () => {

    beforeEach(() => {
        render((<FocusText></FocusText>))
    })

    it("task description defaults to empty", () => {
        let descript = screen.getByTestId('test-descript')
        let status = screen.getByText("Doro")
        expect(descript).toBe("")
        expect(status).toBeVisible()
    })
})

