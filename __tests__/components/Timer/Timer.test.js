 import React from 'react';
 import {render, screen} from "@testing-library/react"
 import "@testing-library/jest-dom"
 import Timer from "../../../src/Components/Timer/Timer/Timer"
 import {chrome} from "jest-chrome"
 import userEvent from "@testing-library/user-event"

 // Test points 
 // - show switch and player
 //     - user signed in or acess_token valid within current time 
 //     - toggle switch visible and user can toggle 
 // - hide switch and player
 //     - not signed
 //     - toggle switch not visible 
 // - note: unable to coverage line 80 since used as prop to Login child component 

 describe("Test Timer component", () => {

    let mockFxn, user, logSpy;
    beforeEach(() => {
        mockFxn = jest.fn(x => {});
        user = userEvent.setup();
        logSpy = jest.spyOn(console, "log");
        // Stub chrome api
        global.chrome.storage.data = {};
        global.chrome.storage.local.set = (inputs) => {
          for (const [key, value] of Object.entries(inputs)) {
            chrome.storage.data[key] = value;
          }
        };
        global.chrome.storage.local["get"] = (keys, callback) => {
          const map = {};
          for (let key of keys) {
            map[key] = chrome.storage.data[key];
          }
          return callback(map);
        };
    })

    it("user signed in shows toggle switch and player window showing", () => {
        chrome.storage.local.set({signedIn: true});
        render(<Timer setShowTimerHandler={mockFxn}/>)
        const toggleSwitchOn = screen.getByTestId("toggle-switch-on");
        const playerWindow = screen.getByText("Player");
        
        expect(toggleSwitchOn).toBeVisible();
        expect(playerWindow).toBeVisible();
        
    })

    it("user signed in can toggle switch to correct windows", async () => {
        chrome.storage.local.set({signedIn: true});
        render(<Timer setShowTimerHandler={mockFxn}/>)
        const toggleSwitchOn = screen.getByTestId("toggle-switch-on");
        
        await user.click(toggleSwitchOn);
        
        const timerWindow = screen.getByText("Timer");
        const toggleSwitchOff = screen.getByTestId("toggle-switch-off");
        expect(timerWindow).toBeVisible();
        
        await user.click(toggleSwitchOff);
        
        const playerWindow = screen.getByText("Player");
        expect(playerWindow).toBeVisible();
    })

    it("user not signed in hides toggle switch and shows clock window ", () => {
        chrome.storage.local.set({signedIn: false});
        render(<Timer setShowTimerHandler={mockFxn}/>)
        const toggleSwitchOn = screen.queryByTestId("toggle-switch-on");
        const playerWindow = screen.queryByText("Player");
        
        expect(toggleSwitchOn).toBeNull();
        expect(playerWindow).toBeNull();
    })

    it("user click on edit button sets parent prop to false", async () => {
        chrome.storage.local.set({signedIn: false});
        render(<Timer setShowTimerHandler={mockFxn}/>)
        const editButton = screen.getByTestId("edit-button");
        await user.click(editButton)
        
        expect(mockFxn).toHaveBeenCalledWith(false)
    })
    
 })