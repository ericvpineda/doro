
import React from 'react';
import {fireEvent, screen, render} from "@testing-library/react"
import '@testing-library/jest-dom'
import Login from '../../../Components/Login/Login/Login'

describe("Test Login component", () => {

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
            },
            runtime: {
                sendMessage: jest.fn()
            }
        }
    })
    
    it("successful signout sets status to success", () => {
        const mockFxn = jest.fn()
        render(<Login setSignedIn={mockFxn}></Login>)
        const spotifyButton = screen.getByTestId("spotify_button");
        fireEvent.click(spotifyButton);

    })

})