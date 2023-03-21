import React from 'react';
import {render, screen} from "@testing-library/react"
import "@testing-library/jest-dom"
import AlbumArt from '../../../src/Components/Timer/SpotifyPlayer/AlbumArt/AlbumArt';
import { PlayerStatus } from '../../../src/Utils/SpotifyUtils';

// Test Points
// - player status: 
//  - loading
//  - success 
//  - ad playing
//  - require webpage 
//  - error

describe("Test AlbumArt component", () => {
    
    it("player status loading shows the loading screen", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.LOADING}></AlbumArt>)
        const albumArt = screen.queryByTestId("album-art");
        const signInPrompt = screen.queryByText("Sign in");
        const adPrompt = screen.queryByText("Ad is currently playing...");
        const errorPrompt = screen.queryByText("Error occured");

        expect(albumArt).not.toBeInTheDocument();
        expect(signInPrompt).not.toBeInTheDocument();
        expect(adPrompt).not.toBeInTheDocument();
        expect(errorPrompt).not.toBeInTheDocument();
    })

    it("player status success, show correct album art link", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.SUCCESS}></AlbumArt>)
        const albumArt = screen.getByTestId("album-art");
        
        expect(albumArt).toBeVisible();
    })

    it("player status ad playing, shows ad screen prompt", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.AD_PLAYING}></AlbumArt>)
        const adPrompt = screen.getByText("Ad is currently playing...")

        expect(adPrompt).toBeVisible();
    })

    it("player status require webpage, shows sign-in requirement prompt", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.REQUIRE_WEBPAGE}></AlbumArt>)
        const signInPromptP1 = screen.getByText("Sign in");
        const signInPromptP4 = screen.getByText("PLAY a song");

        expect(signInPromptP1).toBeVisible();
        expect(signInPromptP4).toBeVisible();
    })

    it("player status error, shows error prompt page", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.ERROR}></AlbumArt>)
        const errorPrompt = screen.getByText("Error occured, please")

        expect(errorPrompt).toBeVisible();
    })

})